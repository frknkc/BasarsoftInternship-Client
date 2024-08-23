// Harita oluşturma
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([35, 39]), // Türkiye'nin koordinatları (Enlem, Boylam)
        zoom: 7
    })
});

// Nokta katmanı
const vectorSource = new ol.source.Vector({ wrapX: false });
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);
// SVG simgesi
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xml:space="preserve">
    <g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
        <path d="M 45 90 c -1.415 0 -2.725 -0.748 -3.444 -1.966 l -4.385 -7.417 C 28.167 65.396 19.664 51.02 16.759 45.189 c -2.112 -4.331 -3.175 -8.955 -3.175 -13.773 C 13.584 14.093 27.677 0 45 0 c 17.323 0 31.416 14.093 31.416 31.416 c 0 4.815 -1.063 9.438 -3.157 13.741 c -0.025 0.052 -0.053 0.104 -0.08 0.155 c -2.961 5.909 -11.41 20.193 -20.353 35.309 l -4.382 7.413 C 47.725 89.252 46.415 90 45 90 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(4,136,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        <path d="M 45 45.678 c -8.474 0 -15.369 -6.894 -15.369 -15.368 S 36.526 14.941 45 14.941 c 8.474 0 15.368 6.895 15.368 15.369 S 53.474 45.678 45 45.678 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
    </g>
</svg>`;

// Stil tanımlama
const pointStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: 'data:image/svg+xml;base64,' + btoa(svgIcon),
        scale: 0.15, // Simgeyi ölçeklendirmek için
        anchor: [0.5, 1] // İşaretin en alt noktasını belirlemek için
    })
});

let selectedFeature = null;

// Pop-up elementi
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const coordX = document.getElementById('coordX');
const coordY = document.getElementById('coordY');
const pointNameInput = document.getElementById('pointName');
const savePointBtn = document.getElementById('savePointBtn');

// Nokta ekleme işlemi
document.getElementById('addPointBtn').addEventListener('click', () => {
    map.getViewport().style.cursor = 'crosshair'; // İmleci lokasyon imleci yap
    map.once('click', (event) => {
        const coord = ol.proj.toLonLat(event.coordinate);
        coordX.textContent = coord[0].toFixed(6);
        coordY.textContent = coord[1].toFixed(6);

        //tıklandığında harita oraya animasyonlu zoom yapma işlemi
        map.getView().animate({
            center: event.coordinate,
            zoom: 10
        });
      
        // Pop-up'ı göster ve konumunu noktanın aşağısında ayarla
        popup.style.display = 'block';
        popup.style.left = event.pixel[0] + 'px';
        popup.style.top = event.pixel[1] + 'px';

        // çıkış butonuna tıklama işlemi
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            //animasyonlu eski haline dönme işlemi
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });

            // Pop-up'ı gizle ve imleci normal yap
            popup.style.display = 'none';
            map.getViewport().style.cursor = 'default';
        }, { once: true });

        // Kaydet butonuna tıklama işlemi
        savePointBtn.addEventListener('click', async () => {
            const point = {
                pointX: parseFloat(coordX.textContent),
                pointY: parseFloat(coordY.textContent),
                name: pointNameInput.value
            };

            try {
                const response = await fetch('https://localhost:7140/api/Point', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(point)
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Point added:', data);

                    // Yeni nokta haritaya eklendiğinde sayfayı yenileme işlemi
                    const feature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.fromLonLat([point.pointX, point.pointY])),
                        id: data.id,
                        name: point.name
                    });
                    feature.setStyle(pointStyle);
                    vectorSource.addFeature(feature);

                } else {
                    console.error('Error adding point:', response.status);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
            //animasyonlu eski haline dönme işlemi
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });

            // Pop-up'ı gizle ve imleci normal yap
            popup.style.display = 'none';
            map.getViewport().style.cursor = 'default';
        }, { once: true });
    });
});

//sayfa yüklendiğinde svg ekleyere tüm noktaları ekrana getirme işlemi
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('https://localhost:7140/api/Point' , {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            });

        console.log(response);
        //noktaları haritaya ekleme işlemi
        if (response.ok) {
            const data = await response.json();

            data.data.forEach(point => {
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([point.pointX, point.pointY])),
                    id: point.id,
                    name: point.name
                });
                feature.setStyle(pointStyle); // SVG simgesini uygula
                vectorSource.addFeature(feature);
            });
        } else {
            console.error('Error getting points:', response.status);
        }

        
    } catch (error) {
        console.error('Fetch error:', error);
        //js panelle bir bildirim pop-upı oluştur ve veri alınamadı hatası ver
        jsPanel.create({
            headerTitle: 'Hata',
            content: 'Veri alınamadı! Lütfen tekrar deneyin.',
            theme: 'danger',
            position: 'center',
            contentSize: '300 100',
            borderRadius: '20px',
            animateIn: 'jsPanelFadeIn',
            animateOut: 'jsPanelFadeOut',
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },

        });
        

    }
});

const FetchAllPoints = async () => {
    try {
        const response = await fetch('https://localhost:7140/api/Point', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('All points:', data);
            return data;
        } else {
            console.error('Error getting points:', response.status);
        }
    }
    catch (error) {
        console.error('Fetch error:', error);
    }
};



document.addEventListener('DOMContentLoaded', () => {
    // Map ve diğer başlangıç kodları burada...

    // Noktaları Listele Butonuna Tıklama Olayı
    document.getElementById('editPointBtn').addEventListener('click', async () => {
        // jsPanel ile yeni bir panel oluşturma
        jsPanel.create({
            //datatables kullanarak tablo oluşturma işlemi
            content: `<table id="pointsTable" class="table table-striped">
                        <thead>
                            <tr>
                                <th>Ad</th>
                                <th>Enlem</th>
                                <th>Boylam</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>`,
            id: 'pointsPanel',
            headerTitle: 'Noktalar',
            theme: 'primary',
            position: 'center-top 0 58',
            contentSize: '800 550',
            borderRadius: '20px',
            // Açılış animasyonu
            animateIn: 'jsPanelFadeIn',
            // Kapanış animasyonu
            animateOut: 'jsPanelFadeOut',
            // yukarıda sadece panel kapatma bulunsun
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },          
            

          
            callback: async () => {
                // DataTables ekleme
                const data = await FetchAllPoints();
                $('#pointsTable').DataTable({
                    data: data.data,
                    columns: [
                        { data: 'name' , title: 'Ad' },
                        { data: 'pointX', title: 'Enlem' },
                        { data: 'pointY' , title: 'Boylam' },
                        {
                            data: null,
                            render: (data, type, row) => {
                                return `
                                    <button id="edit-btn" data-id="${row.id}">Düzenle</button>
                                    <button id="delete-btn" data-id="${row.id}">Sil</button>
                                    <button id="show-btn" data-id="${row.id}">Göster</button>
                                `;
                            }
                        }
                    ]
                });

                //tablodoki göster butonuna tıklandığında animasyonlu zoom yaparak noktaya yaklaşma işlemi
                $('#pointsTable tbody').on('click', '#show-btn', function () {
                    const data = $('#pointsTable').DataTable().row($(this).parents('tr')).data();
                    const feature = vectorSource.getFeatureById(data.id);
                    map.getView().animate({
                        center: feature.getGeometry().getCoordinates(),
                        zoom: 10
                    });
                });
           

                // Kapat butonuna tıklama olayını ekleme
                document.getElementById('closePointsPanel').addEventListener('click', () => {
                    jsPanel.remove('pointsPanel');
                });

                // Düzenle ve Sil butonlarına tıklama olayları
                document.getElementById('editPointBtn').addEventListener('click', async () => {
                    const data = await FetchAllPoints();
                    $('#pointsTable').DataTable().clear().rows.add(data.data).draw();
                }
                );
                document.getElementById('delete-btn').addEventListener('click', async () => {
                    const id = $(this).data('id');
                    try {
                        const response = await fetch(`https://localhost:7140/api/Point/${id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            console.log('Silindi:', id);
                        } else {
                            console.error('Silinemedi:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch hatası:', error);
                    }
                    console.log('Sil:', id);
                }
                );

            }
        });
    });
});

//listede seçilen noktayı haritada gösterme işlemi
document.getElementById('showPointBtn').addEventListener('click', async () => {
    const data = await FetchAllPoints();
    $('#pointsTable').DataTable().clear().rows.add(data.data).draw();
    $('#pointsTable tbody').on('click', '#show-btn', function () {
        const data = $('#pointsTable').DataTable().row($(this).parents('tr')).data();
        const feature = vectorSource.getFeatureById(data.id);
        map.getView().animate({
            center: feature.getGeometry().getCoordinates(),
            zoom: 10
        });
    });
});