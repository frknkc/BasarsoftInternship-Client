document.getElementById('toggle-dark-mode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

document.getElementById('return-to-origin').addEventListener('click', () => {
    map.getView().animate({
        center: ol.proj.fromLonLat([35, 39]),
        zoom: 7
    });
}
);

// Harita oluşturma
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([35, 39]), // Türkiye'nin koordinatları (Enlem, Boylam)
        zoom: 7
    }),

});

const FetchData = async () => {

fetch('https://localhost:7140/api/Wkt')
    .then(response => response.json())
    .then(data => {
        console.log(data);
       
        // Eğer data bir dizi değilse, doğru yapıya erişin
        const wktArray = Array.isArray(data) ? data : data.data || [];

        wktArray.forEach(item => {
            const wktString = item.wktString;
          

            const format = new ol.format.WKT();
            const feature = format.readFeature(wktString, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            let style;
            const geometryType = feature.getGeometry().getType();

            if (geometryType === 'LINESTRING') {
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#FF0000',
                        width: 3
                    })
                });
            } else if (geometryType === 'POLYGON') {
                style = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#0000FF',
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 0, 255, 0.1)'
                    })
                });
            } else if (geometryType === 'POINT') {

                // SVG simgesi
                

                // Stil tanımlama
                style = new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'data:image/svg+xml;base64,' + btoa(svgIcon),
                        scale: 0.1, // Simgeyi ölçeklendirmek için
                        anchor: [0.5, 1] // İşaretin en alt noktasını belirlemek için
                    })
                });
            }

            feature.setStyle(style);
            const vectorSource = new ol.source.Vector({
                features: [feature]
            });

            const vectorLayer = new ol.layer.Vector({
                source: vectorSource
            });

            map.addLayer(vectorLayer);
        });
    })
    .catch(error => {
        console.error('Fetch error:', error);
    });
}

//sayfa yüklendiğinde FetchData fonksiyonunu çalıştır
window.onload = FetchData;

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

        // Tıklandığında harita oraya animasyonlu zoom yapma işlemi
        map.getView().animate({
            center: event.coordinate,
            zoom: 10
        });

        // Pop-up'ı göster ve konumunu noktanın aşağısında ayarla
        popup.style.display = 'block';

        // Çıkış butonuna tıklama işlemi
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            // Animasyonlu eski haline dönme işlemi
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
            const wktPoint = `POINT(${parseFloat(coordX.textContent)} ${parseFloat(coordY.textContent)})`;
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

                    // Yeni nokta haritaya eklendiğinde
                    const format = new ol.format.WKT();
                    const feature = format.readFeature(wktPoint, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
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


                } else {
                    console.error('Error adding point:', response.status);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
            FetchData();

            // Animasyonlu eski haline dönme işlemi
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

                $('#pointsTable tbody').on('click', '.show-btn', function () {
                    console.log('show');

                    const rowId = $(this).data('id');
                    const feature = source.getFeatureById(rowId);
                    list_panel.close();
                    ZoomPoint(rowId);
                });
                
            },
            onclosed: function () {
                //refresh map
                FetchData();
            }
            
        });
    });
});

const fetchWktById = async (id) => {
    const response = await fetch(`https://localhost:7140/api/Wkt/${id}`);
    const data = await response.json();
    return data;
}

const ZoomPoint = async (id) => {
    const data = await fetchWktById(id);
    //eğer feature line ise işlemi
    if (data.data.wktString.includes("LINESTRING")) {
        const wktString = data.data.wktString;
        const name = data.data.name;
        const format = new ol.format.WKT();
        const feature = format.readFeature(wktString, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        //lineın en alt ve en üst noktalarını alıp zoom yapma işlemi
        let coordinates = feature.getGeometry().getCoordinates();
        let firstPoint = coordinates[0];
        let lastPoint = coordinates[coordinates.length - 1];
        let center = [(firstPoint[0] + lastPoint[0]) / 2, (firstPoint[1] + lastPoint[1]) / 2];
        map.getView().animate({
            center: center,
            zoom: 10
        });
    

        var showPanel = jsPanel.create({
            content: `<div>
                    <h3>Nokta Adı: ${name}</h3>
                    <p>WKT String: ${wktString}</p>
                  </div>`,
            headerTitle: 'Nokta Detayı',
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
            onclosed: () => {
                map.getView().animate({
                    center: ol.proj.fromLonLat([35, 39]),
                    zoom: 7
                });
            }
        });
    }
    if(data.data.wktString.includes("POINT")){
        const wktString = data.data.wktString;
        const name = data.data.name;
        const format = new ol.format.WKT();
        const feature = format.readFeature(wktString, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        const pointX = feature.getGeometry().getCoordinates()[0];
        const pointY = feature.getGeometry().getCoordinates()[1];


        map.getView().animate({
            center: [pointX, pointY],
            zoom: 10
        });

        var showPanel = jsPanel.create({
            content: `<div>
                        <h3>Nokta Adı: ${name}</h3>
                        <p>WKT String: ${wktString}</p>
                    </div>`,
            headerTitle: 'Nokta Detayı',
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
            onclosed: () => {
                map.getView().animate({
                    center: ol.proj.fromLonLat([35, 39]),
                    zoom: 7
                });
            }
        });
    }  
    if(data.data.wktString.includes("POLYGON") )
    {
        const wktString = data.data.wktString;
        const name = data.data.name;
        const format = new ol.format.WKT();
        const feature = format.readFeature(wktString, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        //polgonu ekranın tamamını kaplayacak şekilde animasyonlu zoom yapma işlemi
        map.getView().fit(feature.getGeometry().getExtent(), { duration: 2000 });


        

        var showPanel = jsPanel.create({
            content: `<div>
                        <h3>Nokta Adı: ${name}</h3>
                        <p>WKT String: ${wktString}</p>
                    </div>`,
            headerTitle: 'Nokta Detayı',
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
            onclosed: () => {
                map.getView().animate({
                    center: ol.proj.fromLonLat([35, 39]),
                    zoom: 7
                });
            }
        });
    }
}

const select = new ol.interaction.Select();
map.addInteraction(select);
//seçilenin wkt stringini bir stringe atama işlemi
select.on('select', function (e) {
    if (e.selected.length > 0) {
        const feature = e.selected[0];
        const wktString = new ol.format.WKT().writeFeature(feature);
        selectedFeature = feature;
        console.log(wktString);
        //wkt stringe göre data tablosundan veri çekme işlemi
        const data = FetchAllWks();
        data.then((res) => {
            res.data.forEach((item) => {
                if (item.wktString === wktString) {
                    const id = item.id;
                    const name = item.name; 
                    ZoomPoint(id);
                }
            });
        });
    }
});

//line ve polygon çizme işlemi için vector source oluşturma
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

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
                            const data = await response.json();
                            const format = new ol.format.WKT();
                            const feature = format.readFeature(wktString, {
                                dataProjection: 'EPSG:4326',
                                featureProjection: 'EPSG:3857'
                            });

                            const lineStyle = new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: '#FF0000',
                                    width: 3
                                })
                            });

                            feature.setStyle(lineStyle);
                            feature.setId(data.data.id);

                            vectorSource.addFeature(feature);
                        } else {
                            console.error('Error adding line:', response.status);
                        }
                    } catch (error) {
                        console.error('Fetch error:', error);
                    }
                    FetchData();
                    panel.close();
                });
            },
            onclosed: () => {
                map.removeInteraction(draw);
            }
        });
        
        console.log(wktString);
        map.removeInteraction(draw);
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
                                dataProjection: 'EPSG:4326',
                                featureProjection: 'EPSG:3857'
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
                    FetchData();
                    panel.close();
                }
                );
            }
            ,
            onclosed: () => {
                map.removeInteraction(draw);
            }
        });
    }
    );
}
);

//noktaları lineları ve polygonları databaseden çekerek haritada gösterme işlemi


