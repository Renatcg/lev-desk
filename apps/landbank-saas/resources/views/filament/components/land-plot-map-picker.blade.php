@php
    $mapId = 'lev-map-picker-' . md5(($address ?? '') . '|' . ($latitude ?? '') . '|' . ($longitude ?? '') . '|' . uniqid('', true));
    $modalId = $mapId . '-modal';
@endphp

<div
    id="{{ $mapId }}"
    class="lev-map-picker"
    data-address="{{ $address }}"
    data-api-key="{{ $apiKey }}"
    data-latitude="{{ $latitude }}"
    data-longitude="{{ $longitude }}"
>
    @if (filled($apiKey))
        <button class="lev-map-picker__preview" type="button" data-map-open="{{ $modalId }}">
            <span class="lev-map-picker__canvas" data-map-canvas="preview"></span>
        </button>

        <div class="lev-map-picker__modal" id="{{ $modalId }}" aria-modal="true" role="dialog">
            <div class="lev-map-picker__modal-panel">
                <button class="lev-map-picker__modal-close" type="button" data-map-close="{{ $modalId }}">Fechar</button>
                <div class="lev-map-picker__modal-canvas" data-map-canvas="modal"></div>
            </div>
        </div>
    @else
        <div class="lev-map-preview">
            <iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="{{ $embedUrl }}"></iframe>
        </div>
    @endif
</div>

@if (filled($apiKey))
    <script>
        (() => {
            const root = document.getElementById(@js($mapId));

            if (!root || root.dataset.initialized === '1') {
                return;
            }

            root.dataset.initialized = '1';

            const setField = (field, value) => {
                const input = document.querySelector(`[data-landplot-field="${field}"]`);

                if (!input || value === undefined || value === null) {
                    return;
                }

                const prototype = Object.getPrototypeOf(input);
                const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

                if (valueSetter) {
                    valueSetter.call(input, value);
                } else {
                    input.value = value;
                }

                input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: String(value) }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
            };

            const addressPart = (components, type, shortName = false) => {
                const component = components.find((item) => item.types.includes(type));

                return component ? (shortName ? component.short_name : component.long_name) : '';
            };

            const scoreResult = (result) => {
                const components = result.address_components || [];
                const has = (type) => components.some((item) => item.types.includes(type));

                return [
                    has('route'),
                    has('street_number'),
                    has('sublocality_level_1') || has('sublocality') || has('neighborhood') || has('political'),
                    has('administrative_area_level_2') || has('locality'),
                    has('administrative_area_level_1'),
                    has('postal_code'),
                ].filter(Boolean).length;
            };

            const bestAddressResult = (results) => {
                return [...(results || [])].sort((a, b) => scoreResult(b) - scoreResult(a))[0];
            };

            const applyAddress = (result) => {
                const components = result.address_components || [];
                const fallbackStreet = (result.formatted_address || '').split(',')[0] || '';
                const street = addressPart(components, 'route') || fallbackStreet;
                const number = addressPart(components, 'street_number');
                const district = addressPart(components, 'sublocality_level_1') ||
                    addressPart(components, 'sublocality') ||
                    addressPart(components, 'neighborhood');
                const city = addressPart(components, 'administrative_area_level_2') || addressPart(components, 'locality');
                const state = addressPart(components, 'administrative_area_level_1', true);
                const zipCode = addressPart(components, 'postal_code');

                setField('street', street);
                setField('number', number);
                setField('district', district);
                setField('city', city);
                setField('state', state);
                setField('zip_code', zipCode);
            };

            const loadGoogleMaps = () => {
                if (window.google?.maps) {
                    return Promise.resolve();
                }

                if (window.levGoogleMapsPromise) {
                    return window.levGoogleMapsPromise;
                }

                window.levGoogleMapsPromise = new Promise((resolve, reject) => {
                    window.levGoogleMapsReady = resolve;

                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(root.dataset.apiKey)}&callback=levGoogleMapsReady`;
                    script.async = true;
                    script.defer = true;
                    script.onerror = reject;

                    document.head.appendChild(script);
                });

                return window.levGoogleMapsPromise;
            };

            loadGoogleMaps().then(() => {
                const previewCanvas = root.querySelector('[data-map-canvas="preview"]');
                const modal = document.getElementById(@js($modalId));
                const modalCanvas = root.querySelector('[data-map-canvas="modal"]');
                const geocoder = new google.maps.Geocoder();
                const parsedLat = Number.parseFloat(root.dataset.latitude);
                const parsedLng = Number.parseFloat(root.dataset.longitude);
                const hasCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
                const fallbackCenter = { lat: -22.9068, lng: -43.1729 };
                const initialCenter = hasCoordinates ? { lat: parsedLat, lng: parsedLng } : fallbackCenter;

                const mapOptions = {
                    center: initialCenter,
                    mapTypeControl: true,
                    mapTypeId: 'satellite',
                    streetViewControl: true,
                    zoom: hasCoordinates ? 18 : 15,
                };

                const previewMap = new google.maps.Map(previewCanvas, {
                    ...mapOptions,
                    disableDefaultUI: true,
                    gestureHandling: 'none',
                    keyboardShortcuts: false,
                });

                const modalMap = new google.maps.Map(modalCanvas, mapOptions);

                const previewMarker = new google.maps.Marker({
                    draggable: true,
                    map: previewMap,
                    position: initialCenter,
                });

                const modalMarker = new google.maps.Marker({
                    draggable: true,
                    map: modalMap,
                    position: initialCenter,
                });

                const applyLocation = (location) => {
                    const lat = location.lat();
                    const lng = location.lng();

                    previewMarker.setPosition(location);
                    modalMarker.setPosition(location);
                    previewMap.panTo(location);
                    modalMap.panTo(location);
                    setField('latitude', lat.toFixed(8));
                    setField('longitude', lng.toFixed(8));

                    geocoder.geocode({ location }, (results, status) => {
                        const result = status === 'OK' ? bestAddressResult(results) : null;

                        if (result) {
                            applyAddress(result);
                        }
                    });
                };

                modalMap.addListener('click', (event) => applyLocation(event.latLng));
                modalMarker.addListener('dragend', (event) => applyLocation(event.latLng));

                root.querySelector('[data-map-open]')?.addEventListener('click', () => {
                    modal?.classList.add('is-open');
                    setTimeout(() => {
                        google.maps.event.trigger(modalMap, 'resize');
                        modalMap.setCenter(modalMarker.getPosition());
                    }, 50);
                });

                root.querySelector('[data-map-close]')?.addEventListener('click', () => {
                    modal?.classList.remove('is-open');
                });

                modal?.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.classList.remove('is-open');
                    }
                });

                if (!hasCoordinates && root.dataset.address) {
                    geocoder.geocode({ address: root.dataset.address }, (results, status) => {
                        if (status !== 'OK' || !results?.[0]) {
                            return;
                        }

                        previewMarker.setPosition(results[0].geometry.location);
                        modalMarker.setPosition(results[0].geometry.location);
                        previewMap.setCenter(results[0].geometry.location);
                        modalMap.setCenter(results[0].geometry.location);
                    });
                }
            });
        })();
    </script>
@endif
