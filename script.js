// Cookie'ye veri yazmak için bir fonksiyon
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Süreyi belirle (gün cinsinden)
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Cookie'den veri okumak için bir fonksiyon
function getCookie(name) {
    const nameEQ = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return "";
}


document.getElementById('toggle-dark-mode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Dark mode etkinse cookie'ye "enabled" yaz, değilse "disabled" yaz
    if (document.body.classList.contains('dark-mode')) {
        setCookie("darkMode", "enabled", 7); // 7 gün geçerli olacak bir cookie
    } else {
        setCookie("darkMode", "disabled", 7);
    }
});

document.getElementById('return-to-origin').addEventListener('click', () => {
    map.getView().animate({
        center: ol.proj.fromLonLat([35, 39]),
        zoom: 7
    });
}
);

const raster = new ol.layer.Tile({
    source: new ol.source.OSM()
});


const source = new ol.source.Vector({ wrapX: false });

const vector = new ol.layer.Vector({
    source: source,
  
});


const map = new ol.Map({
    target: 'map',
    layers: [raster, vector],
    view: new ol.View({
        center: ol.proj.fromLonLat([35, 39]),
        zoom: 7,
    }),
    
});
map.getInteractions().forEach((interaction) => {
    if (interaction instanceof ol.interaction.DoubleClickZoom) {
        map.removeInteraction(interaction);
    }
});


//line ve polygon çizme işlemi için vector source oluşturma
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

// WKT verilerini çekme işlemi
const FetchData = async () => {
    const response = await fetch('https://localhost:7140/api/Wkt');
    const data = await response.json();
    return data;
}
const svgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="256" height="256" viewBox="0 0 256 256" xml:space="preserve">
                    <g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
                        <path d="M 45 90 c -1.415 0 -2.725 -0.748 -3.444 -1.966 l -4.385 -7.417 C 28.167 65.396 19.664 51.02 16.759 45.189 c -2.112 -4.331 -3.175 -8.955 -3.175 -13.773 C 13.584 14.093 27.677 0 45 0 c 17.323 0 31.416 14.093 31.416 31.416 c 0 4.815 -1.063 9.438 -3.157 13.741 c -0.025 0.052 -0.053 0.104 -0.08 0.155 c -2.961 5.909 -11.41 20.193 -20.353 35.309 l -4.382 7.413 C 47.725 89.252 46.415 90 45 90 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(4,136,219); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
                        <path d="M 45 45.678 c -8.474 0 -15.369 -6.894 -15.369 -15.368 S 36.526 14.941 45 14.941 c 8.474 0 15.368 6.895 15.368 15.369 S 53.474 45.678 45 45.678 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
                    </g>
                </svg>`;
    
const AddFeatures = async () => {
    const data = await FetchData();
    
    // Yeni verileri eklemeden önce mevcut tüm özellikleri temizleyin
    vectorSource.clear();

    
    data.data.forEach((item) => {
        const format = new ol.format.WKT();
        const feature = format.readFeature(item.wktString, {
            dataProjection: 'EPSG:3857',
            featureProjection:  map.getView().getProjection(),
        });

        if (item.wktString.includes("POINT")) {

            //use svg icon for point
            const pointStyle = new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'data:image/svg+xml,' + encodeURIComponent(svgIcon),
                    scale: 0.15 
                })
            });
           
            feature.setStyle(pointStyle);
        }

        if (item.wktString.includes("LINESTRING")) {
            const lineStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#FF0000',
                    width: 3
                })
            });
            feature.setStyle(lineStyle);
        }

        if (item.wktString.includes("POLYGON")) {
            const polygonStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#0000FF',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            });
            feature.setStyle(polygonStyle);
        }

        vectorSource.addFeature(feature);  // Özelliği kaynağa ekleyin
    });
}


    // sayfa yüklendiğinde haritaya verileri ekleme işlemi
    document.addEventListener('DOMContentLoaded', () => {
        AddFeatures();
        const darkModeCookie = getCookie("darkMode");
    if (darkModeCookie === "enabled") {
        document.body.classList.add('dark-mode');
    }
    });

let selectedFeature = null;

// Pop-up elementi
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');
const coordX = document.getElementById('coordX');
const coordY = document.getElementById('coordY');
const pointNameInput = document.getElementById('pointName');
const savePointBtn = document.getElementById('savePointBtn');




const FetchAllWks = async () => {
    const response = await fetch('https://localhost:7140/api/Wkt');
    const data = await response.json();
    return data;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('listMenuBtn').addEventListener('click', () => {
        let list_panel=jsPanel.create({
            content: `<table id="pointsTable" class="table table-striped">
                        <thead>
                            <tr>
                                <th>Ad</th>
                                <th>WKT String</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>`,
            id: 'pointsPanel',
            headerTitle: 'Noktalar',
            theme: 'primary',
            position: 'center-top 0 58',
            contentSize: '750 700',
            borderRadius: '20px',
            animateIn: 'jsPanelFadeIn',
            animateOut: 'jsPanelFadeOut',
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },
            callback: async () => {
                const data = await FetchAllWks();

                const table= $('#pointsTable').DataTable({
                    data: data.data,// API'den gelen veriyi doğrudan kullanıyoruz
                    pageLength: 4,
                    columns: [
                        { data: 'name', title: 'Ad' },  // Veri modelinde "name" alanını kullanarak Ad sütununu oluşturuyoruz
                        { data: 'wktString', title: 'WKT String' },  // WKT String doğru tanımlandı
                        {
                            data: null,
                            render: (data, type, row) => {
                                return `
                                    <button class="edit-btn" data-id="${row.id}">Düzenle</button>
                                    <button class="show-btn" data-id="${row.id}">Göster</button>
                                    <button class="delete-btn" data-id="${row.id}">Sil</button>
                                `;
                            }
                        }
                    ]
                });

                $('#pointsTable tbody').on('click', '.edit-btn', async function () {
                    list_panel.close();
                    const wktString = $(this).closest('tr').find('td:eq(1)').text();
                    const feature = getFeatureByWkt(wktString);
                    openFeaturePanel(feature);
                }
                );

                $('#pointsTable tbody').on('click', '.delete-btn', async function () {
                    const rowId = $(this).data('id');
                    try {
                        const response = await fetch(`https://localhost:7140/api/Wkt/${rowId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            table.row($(this).parents('tr')).remove().draw();
                            map.getLayers().forEach(layer => {
                                if (layer instanceof ol.layer.Vector) {
                                    layer.getSource().clear();
                                    layer.getSource().refresh();
                                }
                            });
                            

                        } else {
                            console.error('Error deleting point:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch error:', error);
                    }
                });

                $('#pointsTable tbody').on('click', '.show-btn', async function () {
                    const id = $(this).data('id');
                    
                    // API'den WKT verisi çek ve seçilen feature ile eşleşen veriyi bul
                    const response = await FetchAllWks();
                    const data = response.data.find(item => item.id === id);
                    
                    const format = new ol.format.WKT();
                    const feature = format.readFeature(data.wktString, {
                        dataProjection: 'EPSG:3857',
                        featureProjection:  map.getView().getProjection(),
                    });
                    const geometry = feature.getGeometry();
                    // Haritada feature'ı ortala ve yakınlaştır
                    map.getView().fit(geometry.getExtent(), { duration: 1000 });
                    list_panel.close();
                    // Feature bilgilerini gösterecek bir panel aç
                    openFeaturePanel(feature);
                });
                
            },
            onclosed: function () {
                //refresh map
                FetchData();
            }
            
        });
    });
});

const getFeatureByWkt = (wktString) => {
    const format = new ol.format.WKT();
    const feature = format.readFeature(wktString, {
        dataProjection: 'EPSG:3857',
        featureProjection:  map.getView().getProjection(),
    });
    return feature;
}

const fetchWktById = async (id) => {
    const response = await fetch(`https://localhost:7140/api/Wkt/${id}`);
    const data = await response.json();
    return data;
}

//linestring çizme işlemi
document.getElementById('drawLineBtn').addEventListener('click', () => {
    map.getViewport().style.cursor = 'crosshair';
    const draw = new ol.interaction.Draw({
        source: vectorSource,
        type: 'LineString'
    });
    map.addInteraction(draw);
    draw.on('drawend', (event) => {

        map.getViewport().style.cursor = 'default';

        const wktString = new ol.format.WKT().writeFeature(event.feature);
        
        var format = new ol.format.WKT();
        var feature = format.readFeature(wktString, {
            dataProjection: 'EPSG:3857',
            featureProjection:  map.getView().getProjection(),
        });
        
        
        //bir jspanel oluştur ve wkt databasei için gerekli isim bilgisini al sonrasında wkt stringini al ve databaseye kaydet

        var panel = jsPanel.create({
            content: `<div>
                        <h3>İsim</h3>
                        <input type="text" id="lineName" class="form-control" />
                        <button id="saveLineBtn" class="btn btn-primary">Kaydet</button>
                    </div>`,
            headerTitle: 'İsim Giriniz',
            theme: 'primary',
            position: 'center-top 0 58',
            contentSize: '400 200',
            borderRadius: '20px',
            animateIn: 'jsPanelFadeIn',
            animateOut: 'jsPanelFadeOut',
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },
            callback: () => {
                document.getElementById('saveLineBtn').addEventListener('click', async () => {
                    const lineName = document.getElementById('lineName').value;

                    const lineData = {
                        wktString: wktString,
                        name: lineName
                    };
                    try {
                        const response = await fetch('https://localhost:7140/api/Wkt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(lineData)
                        });

                        if (response.ok) {
                            
                        } else {
                            console.error('Error adding line:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch error:', error);
                    }
                    AddFeatures();
                    panel.close();
                });
            },
            onclosed: () => {
                map.removeInteraction(draw);
                map.getView().animate({
                    center: ol.proj.fromLonLat([35, 39]),
                    zoom: 7
                });
            }
        });
    });
});

//point çizme işlemi ve databaseye kaydetme işlemi
document.getElementById('drawPointBtn').addEventListener('click', () => {
   map.getViewport().style.cursor = 'crosshair';
   const draw = new ol.interaction.Draw({
         source: vectorSource,
         type: 'Point'
    });
    map.addInteraction(draw);
    draw.on('drawend', (event) => {
        map.getViewport().style.cursor = 'default';
        const coord = ol.proj.toLonLat(event.feature.getGeometry().getCoordinates());
        coordX.textContent = coord[0].toFixed(6);
        coordY.textContent = coord[1].toFixed(6);

        map.getView().animate({
            center: event.feature.getGeometry().getCoordinates(),
            zoom: 10
        });

        popup.style.display = 'block';

        document.getElementById('closePopupBtn').addEventListener('click', () => {
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });
            popup.style.display = 'none';
            map.getViewport().style.cursor = 'default';
        }, { once: true });

        savePointBtn.addEventListener('click', async () => {
            const wktPoint = new ol.format.WKT().writeFeature(event.feature);
            const pointData = {
                wktString: wktPoint,
                name: pointNameInput.value
            };

            try {
                const response = await fetch('https://localhost:7140/api/Wkt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pointData)
                });

                if (response.ok) {
                    const data = await response.json();
                    const format = new ol.format.WKT();
                    const feature = format.readFeature(wktPoint, {
                        dataProjection: 'EPSG:3857',
                        featureProjection:  map.getView().getProjection(),
                    });

                    const pointStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: '#00FF00'
                            }), 
                            stroke: new ol.style.Stroke({
                                color: '#000000',
                                width: 2
                            })
                        })
                    });

                    feature.setStyle(pointStyle);
                    feature.setId(data.data.id);

                    vectorSource.addFeature(feature);
                    map.getView().animate({
                        center: ol.proj.fromLonLat([35, 39]),
                        zoom: 7
                    });
                } else {
                    console.error('Error adding point:', response.status);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
            AddFeatures();
            popup.style.display = 'none';
            
            map.getViewport().style.cursor = 'default';
            
            map.removeInteraction(draw);
        }
        );
    });
});

//polygon çizme işlemi ve databaseye kaydetme işlemi
document.getElementById('drawPolygonBtn').addEventListener('click', () => {
    map.getViewport().style.cursor = 'crosshair';
    const draw = new ol.interaction.Draw({
        source: vectorSource,
        type: 'Polygon'
    });
    map.addInteraction(draw);
   
    draw.on('drawend', (event) => {
        map.getViewport().style.cursor = 'default';
        const wktString = new ol.format.WKT().writeFeature(event.feature);
        var panel = jsPanel.create({
            content: `<div>
                        <h3>İsim</h3>
                        <input type="text" id="polygonName" class="form-control" />
                        <button id="savePolygonBtn" class="btn btn-primary">Kaydet</button>
                    </div>`,
            headerTitle: 'İsim Giriniz',
            theme: 'primary',
            position: 'center-top 0 58',
            contentSize: '400 200',
            borderRadius: '20px',
            animateIn: 'jsPanelFadeIn',
            animateOut: 'jsPanelFadeOut',
            headerControls: {
                minimize: 'remove',
                maximize: 'remove',
            },
            callback: () => {
                document.getElementById('savePolygonBtn').addEventListener('click', async () => {
                    const polygonName = document.getElementById('polygonName').value;
                    const polygonData = {
                        wktString: wktString,
                        name: polygonName
                    };
                    try {
                        const response = await fetch('https://localhost:7140/api/Wkt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(polygonData)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const format = new ol.format.WKT();
                            const feature = format.readFeature(wktString, {
                                dataProjection: 'EPSG:3857',
                                featureProjection:  map.getView().getProjection(),
                            });

                            const polygonStyle = new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: '#0000FF',
                                    width: 3
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(0, 0, 255, 0.1)'
                                })
                            });

                            feature.setStyle(polygonStyle);
                            feature.setId(data.data.id);

                            vectorSource.addFeature(feature);
                        }
                        else {
                            console.error('Error adding polygon:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch error:', error);
                    }
                    AddFeatures();
                    panel.close();
                }
                );
            }
            ,
            onclosed: () => {
                map.removeInteraction(draw);
                map.getView().animate({
                    center: ol.proj.fromLonLat([35, 39]),
                    zoom: 7
                });
                
            }
        });
    }
    );
}
);



// Select interaction oluştur
const selectInteraction = new ol.interaction.Select({
    condition: ol.events.condition.doubleClick,
});

// Select interaction'ı haritaya ekle
map.addInteraction(selectInteraction);

// Seçim olayını dinleyin
selectInteraction.on('select', function (event) {
    //eski seçimleri temizle
    if (selectedFeature) {
        selectedFeature.setStyle(null);
    }
    const feature = event.selected[0];  // Seçilen ilk feature'ı al
    
    if (feature) {
        openFeaturePanel(feature);
    }
});

async function openFeaturePanel( feature) {

    const geometry = feature.getGeometry();
        
        const wktString = new ol.format.WKT().writeFeature(feature);
        // API'den WKT verisi çek ve seçilen feature ile eşleşen veriyi bul
        const response = await FetchAllWks();
        const data = response.data.find(item => item.wktString === wktString);
        //eğer feature point ise haritada feature'ı ortala map yaklaşması 10 olması işlemi


        if (wktString.includes("POINT")) {
            map.getView().animate({
                center: geometry.getCoordinates(),
                zoom: 10
            });
        }

        else {
        // Haritada feature'ı ortala ve yakınlaştır
        map.getView().fit(geometry.getExtent(), { duration: 1000 });
    }
    let detaylar ='';
    if (wktString.includes("POLYGON")) {
        const area = ol.sphere.getArea(geometry, {
            projection: map.getView().getProjection()
        });
        const areaInKm = area / 1000000; // Convert area to square kilometers
        detaylar += `<h3>Alan: ${areaInKm.toFixed(2)} km²</h3>`;
    }

    console.log(detaylar);

    if (wktString.includes("LINESTRING")) {
        const length = ol.sphere.getLength(geometry, {
            projection: map.getView().getProjection()
        });
        const lengthInKm = length / 1000; // Convert length to kilometers
        detaylar += `<h3>Uzunluk: ${lengthInKm.toFixed(2)} km</h3>`;
    }


    // Feature bilgilerini al (örneğin isim veya wktString)
    let featureName = data.name;
    // Panel oluşturma
    var panel = jsPanel.create({
        content: `<div>
                    <h3>Ad: ${featureName}</h3>
                    ${detaylar}
                    <button id="editUsingTextBtn" class="btn btn-primary">Wkt Üzerinden Düzenle</button>
                    <button id="editUsingMapBtn" class="btn btn-primary">Map Üzerinden Düzenle</button> 
                    <button id="deleteFeatureBtn" class="btn btn-danger">Sil</button>
                    <h3>WKT : ${wktString}</h3>
                    
                </div>`,
        headerTitle: 'Feature Bilgileri',
        theme: 'primary',
        position: 'center-top 0 58',
        contentSize: '500 280',
        borderRadius: '20px',
        animateIn: 'jsPanelFadeIn',
        animateOut: 'jsPanelFadeOut',
        headerControls: {
            minimize: 'remove',
            maximize: 'remove',
        },
        callback: () => {
            // Wkt üzerinden düzenleme butonu için event listener ekleyin
            document.getElementById('editUsingTextBtn').addEventListener('click', () => {
                // Wkt üzerinden düzenleme işlemi
                panel.close();
                var panel2 = jsPanel.create({
                    content: `<div>
                                <h3>Ad</h3>
                                <input type="text" id="editName" class="form-control" value="${featureName}" />
                                <input type="text" id="editWkt" class="form-control" value="${wktString}" />
                                <button id="saveEditBtn" class="btn btn-primary">Kaydet</button>
                            </div>`,
                    headerTitle: 'Adı Düzenle',
                    theme: 'primary',
                    position: 'center-top 0 58',
                    contentSize: '400 200',
                    borderRadius: '20px',
                    animateIn: 'jsPanelFadeIn',
                    animateOut: 'jsPanelFadeOut',
                    headerControls: {
                        minimize: 'remove',
                        maximize: 'remove',
                    },
                    callback: () => {
                        document.getElementById('saveEditBtn').addEventListener('click', async () => {
                            
                            const updatedName = document.getElementById('editName').value;
                            const updatedWkt = document.getElementById('editWkt').value;
                            const editData = {
                                id: data.id,
                                name: updatedName,
                                wktString: updatedWkt
                            };
                            
                            try {
                                const response = await fetch(`https://localhost:7140/api/Wkt/${data.id}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(editData)
                                });
                                if (response.ok) {
                                    openFeaturePanel(feature);
                                    panel2.close();
                                } else {
                                    console.error('Error updating feature:', response.status);
                                }
                            } catch (error) {
                                console.error('Fetch error:', error);
                            }
                        });
                    }
                });
            });
            
            // Map üzerinden düzenleme butonu için event listener ekleyin
            document.getElementById('editUsingMapBtn').addEventListener('click', () => {
                // Map üzerinden düzenleme işlemi
                panel.close();
                
                const modify = new ol.interaction.Modify({
                    source: vectorSource,
                    features: new ol.Collection([feature])
                });
                
                map.addInteraction(modify);
            
                modify.on('modifyend', async (event) => {
                    map.getViewport().style.cursor = 'default';
            
                    // Düzenlenen WKT'yi al
                    const updatedWktString = new ol.format.WKT().writeFeature(event.features.item(0));
            
                    // Pop-up butonunu görünür yap
                    const saveEditBtn = document.getElementById('saveChangesBtn');
                    saveEditBtn.style.display = 'block';
            
                    // Kaydet butonuna tıklama işlemi
                    saveEditBtn.addEventListener('click', async () => {
                        const updatedData = {
                            id: data.id,
                            name: data.name,
                            wktString: updatedWktString
                        };
            
                        try {
                            const response = await fetch(`https://localhost:7140/api/Wkt/${data.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(updatedData)
                            });
            
                            if (response.ok) {
                                openFeaturePanel(event.features.item(0));
                            } else {
                                console.error('Error updating feature:', response.status);
                            }
                        } catch (error) {
                            console.error('Fetch error:', error);
                        }
            
                        // Pop-up butonunu tekrar gizle ve etkileşimi kaldır
                        saveEditBtn.style.display = 'none';
                        map.removeInteraction(modify);
                    });
                });
            });


            // Silme butonu için event listener ekleyin
            document.getElementById('deleteFeatureBtn').addEventListener('click', () => {
                //featureı database'den silme işlemi
                fetch(`https://localhost:7140/api/Wkt/${data.id}`, {
                    method: 'DELETE'
                }).then(response => {
                    if (response.ok) {
                    } else {
                        console.error('Error deleting feature:', response.status);
                    }
                }).catch(error => {
                    console.error('Fetch error:', error);
                });
                vectorSource.removeFeature(feature);
                panel.close();
            });

           
        },
        onclosed: () => {
            map.getView().animate({
                center: ol.proj.fromLonLat([35, 39]),
                zoom: 7
            });
            selectInteraction.getFeatures().clear();
        }
    });
}
