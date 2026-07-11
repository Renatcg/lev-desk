@php
    $mapId = 'lev-map-picker-' . md5(($address ?? '') . '|' . ($latitude ?? '') . '|' . ($longitude ?? '') . '|' . uniqid('', true));
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
        <div class="lev-map-picker__canvas"></div>
        <div class="lev-map-picker__hint">Clique no mapa ou arraste o pin para atualizar latitude, longitude e endereço.</div>
    @else
        <div class="lev-map-preview">
            <iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="{{ $embedUrl }}"></iframe>
        </div>
        <div class="lev-map-picker__hint">Para selecionar no mapa e preencher o endereço automaticamente, configure GOOGLE_MAPS_API_KEY no Railway.</div>
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

                if (!input || value === undefined || value === null || value === '') {
                    return;
                }

                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            };

            const addressPart = (components, type, shortName = false) => {
                const component = components.find((item) => item.types.includes(type));

                return component ? (shortName ? component.short_name : component.long_name) : '';
            };

            const applyAddress = (result) => {
                const components = result.address_components || [];
                const street = addressPart(components, 'route');
                const number = addressPart(components, 'street_number');
                const district = addressPart(components, 'sublocality_level_1') || addressPart(components, 'neighborhood');
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
                const canvas = root.querySelector('.lev-map-picker__canvas');
                const geocoder = new google.maps.Geocoder();
                const parsedLat = Number.parseFloat(root.dataset.latitude);
                const parsedLng = Number.parseFloat(root.dataset.longitude);
                const hasCoordinates = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
                const fallbackCenter = { lat: -22.9068, lng: -43.1729 };
                const initialCenter = hasCoordinates ? { lat: parsedLat, lng: parsedLng } : fallbackCenter;

                const map = new google.maps.Map(canvas, {
                    center: initialCenter,
                    mapTypeControl: true,
                    mapTypeId: 'satellite',
                    streetViewControl: true,
                    zoom: hasCoordinates ? 18 : 15,
                });

                const marker = new google.maps.Marker({
                    draggable: true,
                    map,
                    position: initialCenter,
                });

                const applyLocation = (location) => {
                    const lat = location.lat();
                    const lng = location.lng();

                    marker.setPosition(location);
                    map.panTo(location);
                    setField('latitude', lat.toFixed(8));
                    setField('longitude', lng.toFixed(8));

                    geocoder.geocode({ location }, (results, status) => {
                        if (status === 'OK' && results?.[0]) {
                            applyAddress(results[0]);
                        }
                    });
                };

                map.addListener('click', (event) => applyLocation(event.latLng));
                marker.addListener('dragend', (event) => applyLocation(event.latLng));

                if (!hasCoordinates && root.dataset.address) {
                    geocoder.geocode({ address: root.dataset.address }, (results, status) => {
                        if (status !== 'OK' || !results?.[0]) {
                            return;
                        }

                        marker.setPosition(results[0].geometry.location);
                        map.setCenter(results[0].geometry.location);
                    });
                }
            });
        })();
    </script>
@endif
