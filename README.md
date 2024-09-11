
# Basarsoft Stajyerlik Projesi 

**08/2024 - 09/2024 tarihleri arasında Başarsoft Bilgi Teknolojileri (www.basarsoft.com.tr) şirketinde tamamlamış olduğum stajımın frontend kodlarının bulunduğu yerdesiniz.**

Kullandığım openlayers (https://openlayers.org/) kütüphanesi sayesinde veritabanında kayıtlı halde bulunan WKT(Well Known Text) formatında bulunan stringi haritamızda nokta(point), çizgi(line) ve alan(polygon) şekilinde gösterebilmemiz için gerekli frontend kodlarını içermektedir.

Projede Asp.Net v8.0 Web API, Entity Framework, PostgreSQL teknolojileri kullanılmıştır.

Projemizde javascript kütüphanelerinden JsPanel (https://jspanel.de/) ve datatables (https://datatables.net) kütüphaneleri özelleştirilerek kullanılmıştır.

https://github.com/frknkc/BasarsoftInternship-API reposundaki api kullanılarak databasede wkt formatında bulunan layerlar harita üzerine eklenmiştir.

Arayüzde responsive bir tasarım kullanılmış olup navbar tasarımı ekranın altına haritanın üzerine konumlandırılmıştır. İçerisinde Nokta, çizgi ve alan ekleme butonları ve listeleme butonları bulunmaktadır. 

![App Screenshot](https://img001.prntscr.com/file/img001/JQhguY_pR4CHzsOsI5SQoA.png)

Harita ilk yüklendiğinde Türkiye sınırlarını içerisine alacak şekilde zoomlanmış ve cookie'den tema kontrolü yapılarak yüklenmektedir. Sağ üste göründüğü üzere 2 buton bulunmaktadır. Bu butonlardan üstteki dark mode / light mode değişiklik butonu, alttaki ise haritadal, herhangi bir yakınlaştırma, hareket işleminden sonra tek tık ile ana görünüme dönmeyi kolaylaştırmak için eklenmiştir. Dark mode görüntüsü de aşağıdaki gibidir.

![App Screenshot](https://img001.prntscr.com/file/img001/09lde3jsSlWh4AXYSIC_yQ.png
)

**•Nokta Ekleme butonuna basıldığında** mouse imleci crosshaire dönmekte ve işaretlenmek istenilen noktaya basıldığında o noktanın koordinatlarını alıp animasyonlu zoom işlemi ile birlikte bir popup açılmaktadır. popup içerisine o noktaya verilmek istenen ad girildikten sonra kaydet butonuna basıldıktan sonra api post işlemi gerçekleşmekte ve haritaya özelleştirilmiş lokasyon simgesi koyulmaktadır. Artık o nokta database'de wkt formatında bulunmakta ve sayfa her yenilendiğinde fetch işlemi yapılarak haritaya işaretlenmektedir.

![App Screenshot](//s7.ezgif.com/tmp/ezgif-7-e907fe1ea4.gif)

**•Alan Ekleme butonuna basıldığında** mouse imleci crosshaire dönmekte ve işaretlenmek istenilen alanın ilk noktasına basıldığında mouse nereye çekilirse oraya doğru bir kenar çıkmakta ve ilk basılan noktaya dönene kadar o alan ortaya çıkmatadır. İlk noktaya geri dönüldüğünde alan tamamlanmakta ve bir jspanel ortaya çıkmatadır. Bu panelde kullanıcıdan alan için bir isim alınmaktadır. O alana verilmek istenen ad girildikten sonra kaydet butonuna basıldıktan sonra api post işlemi gerçekleşmekte ve haritaya o alan eklenmektedir. Artık o alan database'de wkt formatında bulunmakta ve sayfa her yenilendiğinde fetch işlemi yapılarak haritaya işaretlenmektedir.

![App Screenshot](//s7.ezgif.com/tmp/ezgif-7-8c952b2545.gif)
