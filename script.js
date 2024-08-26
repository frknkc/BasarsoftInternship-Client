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
        const response = await fetch('https://localhost:7140/api/Point', {
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

const FetchPoint = async (id) => {
    try {
        const response = await fetch(`https://localhost:7140/api/Point/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Point:', data);
            return data;
        } else {
            console.error('Error getting point:', response.status);
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
        var table_panel = jsPanel.create({
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
            animateIn: 'jsPanelFadeIn',
            animateOut: 'jsPanelFadeOut',
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },
            callback: async () => {
                // DataTables ekleme
                const data = await FetchAllPoints();
                const table = $('#pointsTable').DataTable({
                    data: data.data,
                    columns: [
                        { data: 'name', title: 'Ad' },
                        { data: 'pointX', title: 'Enlem' },
                        { data: 'pointY', title: 'Boylam' },
                        {
                            data: null,
                            render: (data, type, row) => {
                                return `
                                    <button class="edit-btn" data-id="${row.id}">Düzenle</button>
                                    <button class="delete-btn" data-id="${row.id}">Sil</button>
                                    <button class="show-btn" data-id="${row.id}">Göster</button>
                                `;
                            }
                        }
                    ]
                });



                // Düzenle butonuna tıklama olayını bağlama
                $('#pointsTable tbody').on('click', '.edit-btn', async function () {
                    const id = $(this).data('id');
                    const name = table.row($(this).parents('tr')).data().name;

                    const data = await FetchPoint(id);
                    // jsPanel ile yeni bir panel oluşturma
                    table_panel.close();
                    jsPanel.create({
                       content: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px;">
                       <label>Seçilen Noktanın Enlem Değeri: ${data.data.pointX}</label>
                       <br>
                       <label>Seçilen Noktanın Boylam Değeri: ${data.data.pointY}</label>
                       <br>
                       <label for="pointName" style="margin-top: 10px;">Ad:</label>
                       <input type="text" id="editPointName" value="${name}" style="width: 80%; padding: 5px; margin-top: 5px;">
                       <button id="savePointBtn" style="margin-top: 10px; padding: 5px 15px;">Kaydet</button>
                   </div>`,
                       id: 'editPointPanel',
                       headerTitle: 'Nokta Düzenle',
                       theme: 'primary',
                       position: 'center 0 1',
                       contentSize: '450 200',
                       borderRadius: '20px',
                       animateIn: 'jsPanelFadeIn',
                       animateOut: 'jsPanelFadeOut',
                       headerControls: {
                           minimize: 'remove',
                           maximize: 'remove',
                       },
                       callback: function() {
                           // Kaydet butonuna tıklama olayını bağlama
                           $(document).on('click', '#savePointBtn', async function () {
                               const updatedName = document.getElementById('editPointName').value;
                   
                               const updatedPoint = {
                                   id: id,
                                   name: updatedName,
                                   pointX: data.data.pointX,
                                   pointY: data.data.pointY
                               };
                   
                               try {
                                   const response = await fetch(`https://localhost:7140/api/Point/${id}`, {
                                       method: 'PUT',
                                       headers: {
                                           'Content-Type': 'application/json'
                                       },
                                       body: JSON.stringify(updatedPoint)
                                   });
                   
                                   if (response.ok) {
                                       console.log('Düzenlendi:', updatedPoint);
               
                                       // güncellendi mesajı ver
                                       jsPanel.create({
                                           headerTitle: 'Başarılı',
                                           content: 'Nokta başarıyla güncellendi.',
                                           contentSize: '100 100',
                                           theme: 'success',
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
               
                                   } else {jsPanel.create({
                                    headerTitle: 'Düzeneleme Başarısız',
                                    content: 'Nokta düzenleme başarısız oldu.',
                                    contentSize: '100 100',
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
                               } catch (error) {
                                   console.error('Fetch hatası:', error);
                               }
                           });
                       },

                   });
                   
                });

                // Sil butonuna tıklama olayını bağlama
                $('#pointsTable tbody').on('click', '.delete-btn', async function () {
                    const id = $(this).data('id');
                    try {
                        const response = await fetch(`https://localhost:7140/api/Point/${id}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            console.log('Silindi:', id);
                            table.row($(this).parents('tr')).remove().draw();
                        } else {
                            console.error('Silinemedi:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch hatası:', error);
                    }
                });

                // Göster butonuna tıklama olayını bağlama
                $('#pointsTable tbody').on('click', '.show-btn', async function () {
                    const data = table.row($(this).parents('tr')).data();
                    const feature = vectorSource.getFeatureById(data.id);
                    table_panel.close();
                   ZoomPoint(data.id);
                });

                
            }
        });
    });
});

// haritadaki nokta seçilince bir jsPanel oluşturup seçilen noktanın bilgilerini gösterme işlemi ve düzenleme işlemi
map.on('click', async (event) => {
    map.forEachFeatureAtPixel(event.pixel, async (feature) => {
        const id = feature.get('id');
        const name = feature.get('name');
        selectedFeature = feature;  
        map.getView().animate({
            center: event.coordinate,
            zoom: 10
        });
        editPoint(id, name);
    });
});

// nokta düzenleme işlemi
const editPoint = async (id, name) => {
    const data = await FetchPoint(id);
     // jsPanel ile yeni bir panel oluşturma
     jsPanel.create({
        content: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px;">
        <label>Seçilen Noktanın Enlem Değeri: ${data.data.pointX}</label>
        <br>
        <label>Seçilen Noktanın Boylam Değeri: ${data.data.pointY}</label>
        <br>
        <label for="pointName" style="margin-top: 10px;">Ad:</label>
        <input type="text" id="editPointName" value="${name}" style="width: 80%; padding: 5px; margin-top: 5px;">
        <button id="savePointBtn" style="margin-top: 10px; padding: 5px 15px;">Kaydet</button>
    </div>`,
        id: 'editPointPanel',
        headerTitle: 'Nokta Düzenle',
        theme: 'primary',
        position: 'center 0 1',
        contentSize: '450 200',
        borderRadius: '20px',
        animateIn: 'jsPanelFadeIn',
        animateOut: 'jsPanelFadeOut',
        headerControls: {
            minimize: 'remove',
            maximize: 'remove',
        },
        callback: function() {
            // Kaydet butonuna tıklama olayını bağlama
            $(document).on('click', '#savePointBtn', async function () {
                const updatedName = document.getElementById('editPointName').value;
    
                const updatedPoint = {
                    id: id,
                    name: updatedName,
                    pointX: data.data.pointX,
                    pointY: data.data.pointY
                };
    
                try {
                    const response = await fetch(`https://localhost:7140/api/Point/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedPoint)
                    });
    
                    if (response.ok) {
                        console.log('Düzenlendi:', updatedPoint);

                        // güncellendi mesajı ver
                        jsPanel.create({
                            headerTitle: 'Başarılı',
                            content: 'Nokta başarıyla güncellendi.',
                            contentSize: '100 100',
                            theme: 'success',
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

                    } else {
                        console.error('Düzenlenemedi:', response.status);
                    }
                } catch (error) {
                    console.error('Fetch hatası:', error);
                }
            });
        },

        onclosed: () => {
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });
        }
    });
};

// Nokta yakınlaştırma işlemi
const ZoomPoint = async (id) => {
    const data = await FetchPoint(id);
    const pointX = data.data.pointX;
    const pointY = data.data.pointY;
    map.getView().animate({
        center: ol.proj.fromLonLat([pointX, pointY]),
        zoom: 10
    });
    // bir jspanel oluşturup seçilen noktanın bilgilerini sayfanın en üstünde gösterme işlemi
    jsPanel.create({
        content: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px;">
        <label>Seçilen Noktanın Enlem Değeri: ${pointX}</label>
        <br>
        <label>Seçilen Noktanın Boylam Değeri: ${pointY}</label>
        <br>
        <label>Seçilen Noktanın Adı: ${data.data.name}</label>
    </div>`,
        id: 'showPointPanel',
        headerTitle: 'Seçilen Nokta',
        theme: 'primary',
        position: 'center-top 0 1',
        contentSize: '450 200',
        borderRadius: '20px',
        animateIn: 'jsPanelFadeIn',
        animateOut: 'jsPanelFadeOut',
        headerControls: {
            minimize: 'remove',
            maximize: 'remove',
        },
        onclosed: () => {
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });
        }
    });
};

