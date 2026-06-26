import { supabase } from './config/supabase';

interface ProductInput {
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  images: string[];
  brand: string;
  count_in_stock: number;
  rating: number;
  num_reviews: number;
  features: string[];
  is_featured: boolean;
}

const INDIAN_IMAGES = {
  electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600',
    'https://images.unsplash.com/photo-1550009158-9ebf691452e8?w=600',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
  ],
  'home-kitchen': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
  ],
  books: [
    'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=600',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
  ],
  'sports-outdoors': [
    'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=600',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  ],
};

const pickImg = (cat: string, idx: number): string[] => {
  const pool = INDIAN_IMAGES[cat as keyof typeof INDIAN_IMAGES] || INDIAN_IMAGES.electronics;
  return [pool[idx % pool.length]];
};

const allProducts: ProductInput[] = [];

// ELECTRONICS — 100 products (INR prices ₹299 – ₹1,29,999)
const electronicsBrands = ['Mi', 'Samsung', 'OnePlus', 'Realme', 'Boat', 'Noise', 'Fire-Boltt', 'pTron', 'Mivi', 'Zebronics', 'Portronics', 'Ambrane', 'Sounce', 'Hyperice', 'Wings'];
const electronicsItems = [
  ['Mi 4A 40" Smart LED TV', 'Full HD smart TV with PatchWall UI, Dolby Audio, 20W speakers. Miracast support.', 14999, 21999, 85, 4.2, 45230],
  ['Samsung 55" Neo QLED 4K TV', 'Neo Quantum HDR, Dolby Atmos, 120Hz, Tizen OS with built-in Alexa.', 79999, 99999, 34, 4.6, 23100],
  ['OnePlus 43" Y1S Pro TV', '43-inch FHD Android TV, 24W Dolby Audio, Google Assistant, HDMI ARC.', 23999, 32999, 55, 4.3, 18760],
  ['Realme 32" HD Ready Smart TV', '32-inch HD Android TV, 24W speakers, Chromecast built-in, Bezel-less design.', 10999, 14999, 120, 4.1, 34120],
  ['Boat Airdopes 141 ANC TWS', 'True wireless earbuds with ANC, 42hr playtime, IPX5, ASAP Charge, Beast Mode.', 1999, 3499, 500, 4.3, 89210],
  ['Boat Rockerz 450 Pro Bluetooth', 'Wireless on-ear headphones, 100hr battery, ASAP Charge, Dual EQ Modes.', 1499, 2999, 800, 4.2, 125400],
  ['Noise ColorFit Pro 4 Smartwatch', '1.78" AMOLED display, Bluetooth calling, 100+ watch faces, SpO2, 7-day battery.', 2499, 4999, 350, 4.1, 56780],
  ['Fire-Boltt Ninja 3 Smartwatch', '1.83" display, Bluetooth calling, 300+ watch faces, IP67, 7-day battery.', 1299, 2999, 600, 3.9, 72340],
  ['Mi Smart Band 7 Pro', '1.64" AMOLED display, GPS, SpO2, heart rate, sleep tracking, 14-day battery.', 3499, 5999, 200, 4.3, 45670],
  ['OnePlus Buds Pro 2', 'Co-created with Dynaudio, Adaptive ANC, Spatial Audio, 39hr battery, IP55.', 7999, 11999, 120, 4.4, 34560],
  ['Samsung Galaxy Buds2 Pro', 'Hi-Fi sound, 360 Audio, ANC, IPX7, seamless Galaxy integration.', 8499, 12999, 90, 4.5, 28760],
  ['Realme Buds Air 3', '30dB ANC, 30hr battery, 13.4mm dynamic driver, Dolby Atmos support.', 2499, 3999, 230, 4.2, 41230],
  ['Zebronics Zeb Juke Bar 2500', '2.1 channel soundbar with 30W output, wired/wireless BT, USB, remote.', 2499, 3999, 180, 4.0, 18900],
  ['pTron Retro Bluetooth Speaker', '10W stereo, 12hr playback, TWS pairing, IPX5, type-C charging, retro design.', 999, 1999, 450, 3.9, 34560],
  ['Mivi Duopods M20', '12mm drivers, 60hr playtime, IPX5, low latency gaming mode, type-C.', 999, 1799, 380, 4.0, 28900],
  ['Samsung 27" Curved Monitor', 'Full HD VA panel, 1800R curvature, 75Hz, AMD FreeSync, HDMI, VESA.', 16999, 22999, 60, 4.3, 18760],
  ['Mi 27" 2K IPS Monitor', '2560x1440 IPS, 75Hz, HDR10, USB-C 65W, TUV Low Blue Light.', 21999, 29999, 45, 4.4, 14560],
  ['Zebronics Zeb Thunder S', 'Gaming keyboard with mechanical switches, RGB backlit, 104 keys, wrist rest.', 1799, 2999, 120, 4.1, 23450],
  ['Logitech G102 Lightsync Mouse', '8000 DPI, 6 programmable buttons, RGB lighting, ambidextrous design.', 1495, 2495, 250, 4.3, 56780],
  ['Boat Bassheads 100 Wired', '10mm drivers, tangle-free cable, in-line mic, 3.5mm jack, deep bass.', 349, 699, 1000, 4.0, 234500],
  ['Ambrane 20000mAh Power Bank', '20W PD, 20000mAh, dual output, LED indicator, compact design.', 1299, 2499, 300, 4.2, 45670],
  ['Portronics Power 22 20000mAh', '20000mAh, 22.5W fast charge, dual input, triple output, LED battery indicator.', 1399, 2499, 180, 4.1, 28760],
  ['Sounce Neckband Pro 100', 'Magnetic earbuds, 30hr playtime, IPX5, type-C quick charge, deep bass.', 599, 1299, 400, 3.8, 56780],
  ['Wings Phantom 500 Neckband', '10mm drivers, 40hr battery, IPX5, magnetic earbuds, aptX support.', 899, 1799, 280, 4.0, 23450],
  ['Mi 3i 360° WiFi Router', '300Mbps, 4 antennas, dual-band, parental control, guest network.', 1299, 1999, 500, 4.1, 125400],
  ['TP-Link Archer C80 Router', 'AC1900 dual-band, 3 external antennas, beamforming, WPA3, gigabit ports.', 3499, 4999, 120, 4.4, 34560],
  ['Realme TechLife RBT220', '2200Pa suction, LiDAR navigation, 5000mAh battery, app control, Alexa support.', 9999, 14999, 55, 4.2, 18760],
  ['Mi Robot Vacuum Mop 2C', '2500Pa suction, LDS laser, 4 cleaning modes, 3D obstacle avoidance.', 13999, 19999, 40, 4.3, 14560],
  ['Hyperice Speaker Pro', '20W portable Bluetooth, IPX7, 12hr battery, TWS, built-in mic.', 1999, 3499, 200, 4.1, 23450],
  ['Noise Buds N1 Pro', 'ANC up to 25dB, 45hr total playtime, IPX5, low latency mode, 10mm driver.', 1799, 2999, 340, 4.1, 45670],
  ['Fire-Boltt Ring 3 Smart Ring', 'Health tracker ring, SpO2, heart rate, sleep, activity tracking, 5-day battery.', 4999, 7999, 80, 3.8, 12340],
  ['Mi 24" Desktop Monitor', 'Full HD IPS, 60Hz, 178° viewing angle, anti-glare, VESA mount.', 8999, 11999, 90, 4.2, 23450],
  ['Samsung 20L Convection MW Oven', '20L convection microwave oven, 6 auto cook menus, ceramic enamel cavity.', 8499, 12999, 65, 4.3, 45670],
  ['Realme TechLife Speed Pro Trimmer', '20W motor, 5 speed settings, auto shut-off, 0.5mm precision, IPX7.', 1999, 2999, 150, 4.0, 23450],
  ['Boat Storm Call Smartwatch', '1.69" HD display, Bluetooth calling, heart rate, SpO2, 50 sports modes.', 1799, 3999, 280, 3.9, 45670],
  ['OnePlus Nord Buds 2', '12.4mm drivers, ANC, 36hr battery, Dolby Atmos, IP55, Dirac Tuner.', 2999, 4999, 190, 4.2, 34560],
  ['Samsung 32" M5 Smart Monitor', '32" FHD, smart TV features, wireless DeX, 60Hz, built-in speakers.', 22999, 29999, 35, 4.1, 12340],
  ['Mi Webcam 1080p', 'Full HD 1080p, built-in mic, 360° rotation, privacy cover, plug and play.', 2499, 3499, 180, 4.0, 34560],
  ['Zebronics Zeb Companion 2.1', '2.1 multimedia speakers, 40W RMS, USB SD, remote, AUX input.', 1999, 3499, 120, 4.1, 23450],
  ['pTron Solero 25 Speaker', '25W output, 15hr playback, TWS, RGB lights, Karaoke mic included.', 1999, 3499, 100, 3.9, 12340],
  ['Ambrane 10000mAh PD Power Bank', '10000mAh, 20W PD + QC, compact, LED indicator, type-C + micro USB.', 799, 1499, 350, 4.2, 56780],
  ['Portronics Decibel 21 Speaker', '20W, 10hr battery, TWS, FM, USB, AUX, memory card slot.', 1299, 2299, 140, 4.0, 23450],
  ['Sounce X10 Bluetooth Speaker', '12W stereo, 16hr playback, IPX7, TWS, RGB lights, built-in mic.', 1499, 2499, 120, 4.1, 18900],
  ['Mi Band 8 Active', '1.47" AMOLED, 60Hz, SpO2, heart rate, 100+ watch faces, 14-day battery.', 2499, 3999, 300, 4.2, 67890],
  ['Noise Twist Smartwatch', '1.45" square dial, Bluetooth calling, 100+ sports modes, 7-day battery.', 1999, 3999, 250, 4.0, 34560],
  ['Fire-Boltt Dagger Pro', '1.43" AMOLED, Bluetooth calling, 400+ watch faces, IP68, built-in games.', 2999, 5999, 160, 4.1, 23450],
  ['OnePlus 100W Type-C Cable', '100W fast charging, USB 3.1, 1M, braided cable, 5Gbps transfer.', 999, 1999, 600, 4.3, 123400],
  ['Samsung 45W PD Travel Adapter', '45W super fast charging, type-C, GaN technology, compact foldable plug.', 2499, 3999, 200, 4.2, 34560],
  ['Realme 65W SuperDart Charger', '65W fast charger, type-C, GaN, compatible with Realme and OnePlus devices.', 1999, 2999, 150, 4.1, 23450],
  ['Mi 80W Wireless Charging Stand', '80W max, dual coil, Qi compatible, silent fan, LED indicator.', 3999, 5999, 80, 4.2, 12340],
  ['Boat Airdopes 411 Pro', 'ANC 25dB, 60hr battery, 13mm driver, IPX5, gaming mode with low latency.', 2499, 3999, 220, 4.2, 34560],
  ['Noise Buds VS102', '10mm driver, 35hr playtime, IPX5, type-C, gaming mode, voice assistant.', 1299, 2499, 300, 4.0, 45670],
  ['Fire-Boltt Fury Smartwatch', '1.39" HD round dial, Bluetooth calling, 100+ sports, IP67, SpO2.', 1499, 3499, 280, 3.8, 56780],
  ['Zebronics Zeb Pods Spark', '13mm driver, 24hr battery, IPX5, touch control, voice assistant.', 599, 1499, 450, 3.7, 67890],
  ['Mi 360° Home Security Camera', '1080p, 360° pan-tilt, night vision, two-way audio, SD cloud storage.', 2499, 3499, 180, 4.1, 34560],
  ['TP-Link Tapo C200 Camera', '1080p, 360°, night vision, motion detection, two-way audio, SD up to 256GB.', 2499, 3499, 140, 4.2, 23450],
  ['OnePlus 60W GaN Charger', '60W dual port (USB-C + USB-A), GaN, compact, foldable plug.', 2499, 3999, 160, 4.3, 18760],
  ['Samsung T7 Portable SSD 1TB', '1050MB/s read, 1TB, USB 3.2, AES 256-bit, compact shock resistant.', 8499, 12999, 65, 4.6, 23450],
  ['Mi Portable SSD 512GB', '500MB/s read, 512GB, USB 3.1, aluminium body, compact design.', 4999, 6999, 80, 4.2, 12340],
  ['Realme TechLife Keyboard Mouse Combo', 'Full-size keyboard + mouse, 2.4GHz wireless, 12-month mouse battery, slim design.', 999, 1799, 200, 4.0, 23450],
  ['Zebronics Zeb Max Plus Wireless', 'Full-size wireless keyboard + mouse, 2.4GHz, 12 multimedia keys.', 799, 1499, 150, 3.9, 34560],
  ['Boat Stone X1000 Speaker', '60W RMS, 24hr battery, IPX7, TWS, USB, aux, FM, EQ modes.', 6999, 9999, 60, 4.3, 18760],
  ['Noise ColorFit Pulse 2', '1.8" HD display, Bluetooth calling, 100+ sports, heart rate, SpO2.', 1799, 3499, 280, 4.0, 45670],
  ['Fire-Boltt 4G Smartwatch Pro', '4G calling, 1.43" AMOLED, Google Play Store, GPS, 8MP camera.', 9999, 14999, 40, 3.8, 12340],
  ['OnePlus Nord CE 5G Phone', '6.43" AMOLED, Snapdragon 695, 8GB RAM, 128GB, 5000mAh, 67W.', 21999, 27999, 55, 4.2, 34560],
  ['Samsung Galaxy M14 5G', '6.6" PLS LCD, Exynos 1330, 6GB RAM, 128GB, 6000mAh, 25W.', 11999, 15999, 90, 4.1, 56780],
  ['Mi 11X 5G', '6.67" AMOLED 120Hz, Snapdragon 870, 8GB RAM, 256GB, 48MP OIS.', 24999, 32999, 30, 4.3, 23450],
  ['Realme Narzo 70 Pro 5G', '6.67" AMOLED 120Hz, Dimensity 7050, 8GB RAM, 256GB, 5000mAh, 67W.', 15999, 21999, 70, 4.1, 34560],
  ['Boat Airdopes 121 Pro TWS', 'ANC 30dB, 50hr battery, 10mm driver, IPX5, low latency gaming.', 2999, 4499, 190, 4.2, 45670],
  ['Noise Buds N1', '10mm driver, 35hr playtime, IPX5, type-C, gaming mode, voice assistant.', 999, 1999, 400, 3.9, 67890],
  ['Fire-Boltt Visionary Smartwatch', '1.43" round AMOLED, Bluetooth calling, SpO2, 100+ sports, IP67.', 3499, 5999, 120, 4.0, 23450],
  ['Zebronics Zeb Pixa Plus 25', '25W GaN charger, type-C PD + QC, compact foldable, universal compatibility.', 999, 1799, 280, 4.0, 34560],
  ['Mi Smart Plug WiFi', 'WiFi smart plug, 10A, Alexa & Google support, energy monitoring, timer.', 999, 1499, 300, 4.1, 45670],
  ['TP-Link Tapo L510E Bulb', '9W WiFi smart bulb, warm white, Alexa & Google, schedule timer.', 499, 999, 500, 4.0, 78900],
  ['Samsung 10,000mAh PD Power Bank', '10000mAh, 25W PD, dual USB-C + USB-A, slim design, LED indicator.', 2499, 3999, 150, 4.2, 23450],
  ['OnePlus 80W SUPERVOOC Charger', '80W fast charger, type-C, compatible with OnePlus 12 series, compact.', 2999, 4499, 80, 4.3, 12340],
  ['Realme Buds Wireless 3', 'Neckband with 12.4mm driver, 30dB ANC, 20hr battery, IPX5, fast charge.', 1999, 2999, 200, 4.1, 34560],
  ['Boat Rockerz 550 ANC', 'Hybrid ANC, 60hr battery, 50mm driver, low latency, dual EQ, foldable.', 2999, 4999, 140, 4.2, 45670],
  ['Mi Notebook Ultra 16"', '16" 4K+ OLED, i7 12th, 16GB, 512GB, backlit KB, fingerprint.', 74999, 89999, 25, 4.4, 12340],
  ['Samsung Galaxy Book3 360', '13.3" FHD AMOLED touch, i5 13th, 16GB, 512GB, S Pen, 360 hinge.', 84999, 109999, 20, 4.5, 8900],
  ['Zebronics Zeb Book Pro', '14" FHD, i3 12th, 8GB, 256GB SSD, Windows 11, 8hr battery.', 25999, 34999, 40, 3.8, 12340],
  ['Logitech C920 HD Pro Webcam', 'Full HD 1080p, autofocus, stereo mic, 78° FOV, privacy cover.', 6499, 8499, 90, 4.4, 56780],
  ['Seagate 1TB External HDD', '1TB, USB 3.0, 2.5" portable, drag-and-drop, PC/Mac.', 4499, 5999, 200, 4.2, 123400],
  ['SanDisk Ultra 128GB SD Card', '128GB, UHS-I, C10, U1, up to 140MB/s read, A1 app performance.', 1299, 1999, 500, 4.3, 234500],
  ['Mi 22.5W Fast Charger', '22.5W type-C fast charger, QC 3.0, compatible with all Qualcomm devices.', 599, 999, 600, 4.1, 189000],
  ['Boat Rugged Bluetooth Speaker', '20W, 14hr battery, IP67, TWS, USB, aux, built-in mic.', 2999, 4999, 100, 4.0, 34560],
  ['Noise ColorFit Caliber', '1.69" HD display, 100+ watch faces, heart rate, SpO2, sleep, 7-day battery.', 999, 1999, 400, 3.9, 56780],
  ['Fire-Boltt Ninja Call Pro Plus', '1.83" display, BT calling, 100+ sports, IP67, heart, SpO2, 7-day battery.', 1799, 3499, 300, 3.9, 67890],
  ['OnePlus Bullets Wireless Z2', 'Neckband with 12.4mm driver, 30hr battery, fast charge, IP55, bass.', 1499, 2499, 280, 4.1, 56780],
  ['Samsung 25W Travel Adapter', '25W super fast charging, type-C, compact, universal compatibility.', 1499, 2499, 350, 4.2, 123400],
  ['Realme 33W Dart Charger', '33W fast charger, type-C, VOOC compatible, 18W QC, compact.', 999, 1799, 280, 4.1, 45670],
  ['Mi 5A Cable Braided 1M', '5A 100W braided type-C cable, fast charging, durable, 1 meter.', 299, 599, 1000, 4.0, 345600],
  ['Boat Airdopes 131', '8mm driver, 30hr battery, IPX5, touch control, voice assistant, type-C.', 999, 1999, 500, 4.0, 123400],
  ['Zebronics Zeb Yoda Wireless', 'Full-size wireless mouse, 1600 DPI, silent clicks, 12-month battery.', 399, 799, 400, 3.9, 67890],
  ['Portronics Muffs P2 Headset', 'Over-ear wired headset, 50mm driver, adjustable mic, volume control.', 499, 999, 350, 3.8, 45670],
  ['Ambrane 60W GaN Charger', '60W dual port (USB-C + USB-A), GaN, compact, foldable, universal.', 1999, 3499, 120, 4.1, 23450],
  ['pTron Solero TWS 10', '10mm driver, 24hr battery, IPX5, touch control, gaming mode, type-C.', 699, 1499, 350, 3.9, 56780],
  ['Mivi Duopods A25', '10mm driver, 50hr battery, IPX5, low latency, gaming mode, touch controls.', 799, 1499, 380, 4.0, 45670],
  ['Sounce Neckband Pro 300', '10mm drivers, 35hr battery, IPX5, magnetic earbuds, type-C.', 799, 1299, 250, 3.9, 23450],
  ['Hyperice Buds X1', '13mm driver, 40hr battery, ANC 28dB, IPX5, low latency gaming mode.', 1499, 2499, 140, 4.0, 23450],
  ['Wings Phantom 700', 'Over-ear Bluetooth, 50hr battery, Foldable, Deep Bass, Dual EQ.', 1299, 2499, 160, 4.0, 34560],
  ['Mi 3S Smart Security System', 'Door sensor + motion sensor + hub, app alerts, Alexa compatible.', 1999, 2999, 100, 4.0, 12340],
  ['TP-Link Archer AX10 Router', 'AX1500 dual-band, 4 antennas, WPA3, MU-MIMO, gigabit ports.', 2999, 4499, 90, 4.2, 34560],
  ['Noise D61 Smartwatch', '1.39" round dial, BT calling, 100+ sports, SpO2, IP68, 7-day battery.', 2499, 3999, 140, 4.0, 34560],
  ['OnePlus 50W Wireless Charger', '50W max, dual coil stand, cooling fan, Warp Charge compatible.', 3999, 5499, 60, 4.3, 12340],
  ['Samsung Galaxy Watch 6 44mm', '1.47" Super AMOLED, Wear OS, BioActive sensor, GPS, 3-day battery.', 29999, 39999, 30, 4.4, 18760],
];

const electronicsProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('electronics', i),
  brand: electronicsBrands[i % electronicsBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 4).map((f: string) => f.trim()).filter(Boolean),
  is_featured: i < 15,
});

// FASHION — 80 products
const fashionBrands = ['Biba', 'Fabindia', 'Manyavar', 'Pantaloons', 'Zara', 'H&M', 'W', 'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Peter England', 'UCB', 'Tommy Hilfiger', 'USPA', 'Levis', 'Spykar', 'Flying Machine', 'Pepe Jeans', 'Numero Uno', 'Killer'];
const fashionItems = [
  ['Biba Ethnic Embroidered Kurta Set', 'Cotton silk kurta with chanderi salwar and dupatta. Festive occasion wear.', 2499, 3999, 120, 4.3, 23450],
  ['Fabindia Organic Cotton Saree', 'Handwoven organic cotton saree with block print. 6.3 meters length.', 2999, 4499, 70, 4.4, 18760],
  ['Manyavar Navy Indo-Western Sherwani', 'Designer faux georgette sherwani with thread work. Wedding groom wear.', 8999, 14999, 30, 4.6, 8920],
  ['Pantaloons Black Formal Trousers', 'Premium stretch formal trousers with zip fly. Wrinkle resistant.', 1699, 2499, 140, 4.1, 34560],
  ['Zara Tailored Fit Blazer', 'Slim fit blazer in stretch wool blend. Notch lapel, two-button closure.', 9990, 12990, 45, 4.3, 12340],
  ['H&M Relaxed Fit Linen Shirt', '100% linen relaxed shirt. Comfortable summer fit with button-down collar.', 2499, 3499, 200, 4.2, 45670],
  ['W Women Printed Maxi Dress', 'Floral print maxi dress with ruffled hem. Lightweight georgette fabric.', 1999, 2999, 80, 4.0, 23450],
  ['Allen Solly Regular Fit Polo', 'Cotton pique polo with embroidered logo. Regular fit with ribbed cuffs.', 1299, 1999, 300, 4.1, 56780],
  ['Van Heusen Formal Shirt', 'Premium cotton formal shirt with spread collar. Easy iron fabric.', 1499, 2299, 250, 4.2, 45670],
  ['Louis Philippe Suit Set', '2-piece suit in super 100s wool. Single breasted with notch lapel.', 14999, 22999, 25, 4.5, 5670],
  ['Peter England Casual Shirt', 'Checked casual shirt in soft cotton. Regular fit with patch pocket.', 1099, 1799, 350, 4.0, 67890],
  ['USPA Classic T-Shirt', 'Premium pique cotton t-shirt with logo embroidery. Regular fit.', 999, 1599, 500, 4.0, 123400],
  ['Tommy Hilfiger Trifold Wallet', 'Genuine leather wallet with RFID block. 8 card slots, ID window.', 3499, 4999, 180, 4.3, 34560],
  ['Levis 512 Slim Taper Jeans', 'Slim taper fit jeans in stretch denim. Mid-rise with zip fly.', 2499, 3499, 200, 4.3, 56780],
  ['Spykar Skinny Fit Jeans', 'Super skinny jeans with extreme stretch. Fade wash with whiskering.', 1899, 2999, 150, 4.1, 34560],
  ['Flying Machine Cargo Joggers', 'Cotton cargo joggers with drawstring waist. Multiple zip pockets.', 1599, 2499, 120, 4.0, 23450],
  ['Pepe Jeans Lightweight Jacket', 'Quilted bomber jacket with zip front. Lightweight with stand collar.', 4999, 6999, 60, 4.2, 12340],
  ['Killer Distressed Denim Jacket', 'Classic denim jacket with distressed details. Button front with chest pockets.', 3499, 5499, 55, 4.1, 18760],
  ['Biba Cotton Straight Kurta', 'Pure cotton straight kurta with A-line cut. Embroidery on neckline.', 1499, 2499, 160, 4.2, 34560],
  ['Fabindia Handblock Stole', 'Handblock printed cotton stole. Lightweight, 2.2m x 0.8m.', 799, 1299, 300, 4.1, 45670],
  ['Manyavar Kurta Pyjama Set', 'Rayon embroidered kurta with dhoti pyjama. Festive ready-to-wear set.', 2999, 4999, 100, 4.3, 23450],
  ['Pantaloons Jogger Pants', 'French terry jogger pants with elastic waist. Sporty casual style.', 1299, 1999, 180, 4.0, 34560],
  ['Zara High-Waist Trousers', 'High-waist wide leg trousers in crepe fabric. Side zip closure.', 5990, 7990, 65, 4.2, 12340],
  ['H&M Printed T-Shirt', 'Soft cotton jersey t-shirt with graphic print. Regular fit crew neck.', 799, 1299, 600, 3.9, 123400],
  ['W Women Anarkali Dress', 'Floor-length anarkali dress with round neck. Embroidered mesh fabric.', 3499, 4999, 50, 4.2, 12340],
  ['Allen Solly Chino Shorts', 'Cotton stretch chino shorts with zip fly. Flat front, belt loops.', 1199, 1799, 200, 4.0, 34560],
  ['Van Heusen Track Jacket', 'Full zip track jacket with stand collar. Zippered pockets, elastic cuffs.', 1999, 2999, 90, 4.1, 23450],
  ['Louis Philippe Silk Tie', 'Italian silk tie in classic striped pattern. 8cm width, 147cm length.', 2499, 3499, 120, 4.2, 12340],
  ['Peter England Sweater', 'Fine knit cotton sweater with ribbed crew neck. Regular fit long sleeves.', 1599, 2499, 100, 4.0, 23450],
  ['USPA Leather Belt', 'Genuine leather belt with embossed logo buckle. 35mm width.', 1999, 2999, 250, 4.1, 45670],
  ['Tommy Hilfiger Backpack', 'Signature logo backpack with padded laptop compartment. 30L capacity.', 6999, 9999, 80, 4.4, 23450],
  ['Levis Trucker Denim Jacket', 'Iconic trucker jacket in rigid denim. Button front with waist tabs.', 5999, 7999, 45, 4.5, 12340],
  ['Spykar Bomber Jacket', 'Satin bomber jacket with ribbed hem and cuffs. Zip front with pockets.', 2999, 4499, 55, 4.1, 18760],
  ['Flying Machine Ripped Skinny Jeans', 'Ripped skinny jeans with extreme stretch. Low rise, zip fly.', 1799, 2999, 130, 4.0, 34560],
  ['Pepe Jeans Oxford Shirt', 'Checked oxford shirt in cotton. Button-down collar, patch pocket.', 2499, 3499, 110, 4.2, 23450],
  ['Killer Polo T-Shirt', 'Cotton pique polo with contrast collar. Slim fit, 2-button placket.', 999, 1599, 200, 3.9, 34560],
  ['Biba Silk Blend Saree', 'Silk blend saree with zari border. Ready-to-wear with blouse piece.', 3999, 5999, 70, 4.3, 18760],
  ['Fabindia Khadi Scarf', 'Handwoven khadi cotton scarf with natural dyes. 1.2m x 0.6m.', 599, 999, 400, 4.0, 56780],
  ['Manyavar Wedding Kurta', 'Designer wedding kurta in silk blend. Embroidered neckline and cuffs.', 4999, 7999, 40, 4.4, 8920],
  ['Pantaloons Night Suit Set', 'Cotton night suit with printed kurta and pajama. Soft breathable fabric.', 999, 1599, 300, 4.0, 45670],
  ['Zara Midi Slip Dress', 'Satin midi slip dress with adjustable straps. Cowl neckline.', 4990, 6990, 70, 4.2, 12340],
  ['H&M Oversized Hoodie', 'Oversized fleece hoodie with kangaroo pocket. Dropped shoulder style.', 2499, 3499, 130, 4.1, 34560],
  ['W Women Palazzo Pants', 'Flowing palazzo pants in viscose crepe. Elastic waist with drawstring.', 1299, 1999, 140, 4.0, 23450],
  ['Allen Solly Sport Shoes', 'Lightweight knit sneakers with cushioned sole. Breathable mesh upper.', 2999, 4499, 100, 4.1, 34560],
  ['Van Heusen Formal Shoes', 'Genuine leather lace-up formal shoes. Cushioned insole, rubber sole.', 4999, 6999, 80, 4.2, 23450],
  ['Louis Philippe Cufflinks Set', 'Silver-tone geometric cufflinks in gift box. Premium formal accessory.', 1999, 2999, 90, 4.0, 12340],
  ['Peter England Boxer Shorts Pack', 'Pack of 3 cotton stretch boxers. Elastic waist, soft breathable fabric.', 699, 1199, 400, 3.9, 67890],
  ['USPA Sunglasses Aviator', 'Polarized aviator sunglasses with UV400. Metal frame with adjustable nose.', 2499, 3999, 100, 4.1, 23450],
  ['Tommy Hilfiger Cap', 'Classic baseball cap with embroidered logo. Pre-curved brim, adjustable back.', 1999, 2999, 200, 4.2, 34560],
  ['Levis 501 Original Fit Jeans', 'Original 501 straight jeans in rigid denim. Button fly, classic 5-pocket.', 3499, 4999, 90, 4.5, 56780],
  ['Spykar Jogger Jeans', 'Jogger style jeans with elastic cuffs. Stretch denim with drawstring waist.', 1999, 2999, 110, 4.0, 23450],
  ['Flying Machine Cargo Shorts', 'Cotton cargo shorts with multiple pockets. Elastic waist with belt loops.', 1199, 1799, 150, 3.9, 34560],
  ['Pepe Jeans Formal Blazer', '2-button blazer in stretch polyester. Notch lapel with breast pocket.', 7499, 9999, 35, 4.2, 12340],
  ['Killer Graphic T-Shirt', 'Oversized cotton t-shirt with front graphic print. Drop shoulder style.', 799, 1299, 250, 3.8, 45670],
  ['Biba Cotton Kurti with Leggings', 'Pack of 2 cotton kurtis with leggings. Floral printed, round neck.', 1799, 2999, 200, 4.1, 34560],
  ['Fabindia Cotton Dhoti Pants', 'Handwoven cotton dhoti pants with drawstring. Relaxed fit, natural dyes.', 999, 1599, 280, 4.0, 23450],
  ['Manyavar Silk Wedding Jacket', 'Pure silk wedding jacket with zari embroidery. Open front, sleeveless.', 7999, 12999, 25, 4.5, 5670],
  ['Pantaloons Linen Blend Shirt', 'Linen blend casual shirt with spread collar. Relaxed fit, rolled sleeves.', 1499, 2299, 140, 4.1, 34560],
  ['Zara Overshirt Jacket', 'Utility overshirt in cotton blend. Chest pockets, button front, relaxed fit.', 7990, 9990, 40, 4.2, 8900],
  ['H&M Ribbed Knit Top', 'Ribbed knit top in stretch cotton. Crew neck, short sleeves, bodycon fit.', 999, 1499, 300, 4.0, 56780],
  ['W Women Floral Top', 'Georgette floral printed top with ruffled sleeves. V-neck, regular fit.', 899, 1499, 180, 3.9, 23450],
  ['Allen Solly Men Watch', 'Analog watch with blue dial and stainless steel strap. Water resistant 50m.', 3999, 5999, 80, 4.0, 23450],
  ['Van Heusen Belt Set', 'Pack of 2 genuine leather belts. Black and brown, 35mm width.', 1999, 2999, 150, 4.1, 34560],
  ['Louis Premium Cashmere Scarf', 'Luxury cashmere blend scarf with fringe edges. 180cm x 30cm.', 3499, 4999, 60, 4.3, 12340],
  ['Peter England Sports Shoes', 'Knit running shoes with memory foam insole. Lightweight and breathable.', 2999, 4499, 120, 4.0, 34560],
  ['USPA Luggage Bag 55cm', 'Hard side cabin luggage with 4 spinner wheels. TSA lock, 55cm cabin size.', 5999, 8999, 50, 4.2, 18760],
  ['Tommy Hilfiger Duffle Bag', 'Weekender duffle bag with shoulder strap. 50L capacity, water-resistant.', 7999, 10999, 35, 4.3, 12340],
  ['Levis Commuter Backpack', 'Riding backpack with helmet carry. 25L, padded laptop sleeve, reflective.', 3999, 5999, 65, 4.2, 23450],
  ['Spykar Denim Shorts', 'Denim shorts with distressed details. Rolled hem, 5-pocket styling.', 1499, 2299, 110, 4.0, 23450],
  ['Flying Machine Printed T-Shirt', 'Cotton t-shirt with brand logo print. Regular fit crew neck, half sleeves.', 699, 1199, 350, 3.8, 45670],
  ['Pepe Jeans Cargo Joggers', 'Stretch cotton joggers with cargo pockets. Elastic cuffs, drawstring waist.', 2299, 3499, 90, 4.1, 23450],
  ['Killer Bomber Jacket', 'Nylon bomber jacket with quilted lining. Zip front, ribbed cuffs and hem.', 3999, 5999, 45, 4.0, 18760],
  ['Biba Party Wear Gown', 'Embellished floor-length gown in net fabric. Round neck with full sleeves.', 4999, 7999, 40, 4.3, 12340],
  ['Fabindia Cotton Wrap Skirt', 'Handwoven cotton wrap skirt with tassels. Adjustable waist, midi length.', 1899, 2799, 80, 4.1, 23450],
  ['Manyavar Cotton Nehru Jacket', 'Pure cotton Nehru jacket with button front. Festive and wedding wear.', 3999, 5999, 55, 4.2, 12340],
  ['Pantaloons Slim Formal Pants', 'Stretch cotton formal pants with flat front. Zip fly with hook bar.', 1499, 2299, 160, 4.0, 34560],
];

const fashionProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('fashion', i),
  brand: fashionBrands[i % fashionBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 4).map((f: string) => f.trim()).filter(Boolean),
  is_featured: false,
});

// HOME & KITCHEN — 80 products
const homeBrands = ['Prestige', 'Butterfly', 'Pigeon', 'Hawkins', 'Bajaj', 'Philips', 'Usha', 'Havells', 'Croma', 'Morphy Richards', 'Wonderchef', 'Milton', 'Cello', 'Borosil', 'GreenPan'];
const homeItems = [
  ['Prestige 5L Pressure Cooker', 'Aluminum pressure cooker with hard anodized body. 5L capacity, 2 whistles.', 2499, 3499, 150, 4.4, 56780],
  ['Butterfly 4L Stove Top Cooker', 'Stainless steel pressure cooker. 4L capacity, 3 safety valves.', 1999, 2999, 180, 4.2, 34560],
  ['Pigeon 1.5L Electric Kettle', 'Stainless steel kettle with auto shut-off. 1500W, boil-dry protection.', 799, 1299, 400, 4.1, 123400],
  ['Hawkins 3L Futura Cooker', 'Hard anodized 3L pressure cooker. Induction compatible, 10yr warranty.', 3499, 4499, 80, 4.5, 23450],
  ['Bajaj 25L OTG Oven', '25L oven toaster griller with 1500W. 4 heating modes, 60min timer.', 4499, 5999, 65, 4.2, 34560],
  ['Philips 2L Food Processor', '2L food processor with 3 discs. 700W motor, 3-speed, pulse function.', 4999, 6999, 45, 4.3, 23450],
  ['Usha 3-Speed Table Fan', '400mm sweep table fan with 3 speeds. Aerodynamic blades, low noise.', 1499, 2299, 300, 4.0, 56780],
  ['Havells 1200mm Ceiling Fan', '1200mm ceiling fan with high air delivery. Energy efficient, 5yr warranty.', 2499, 3499, 200, 4.2, 123400],
  ['Croma 43" Full HD TV', '43" Full HD LED TV with 3 HDMI, 2 USB, Dolby audio, wall mount included.', 21999, 28999, 40, 4.1, 23450],
  ['Morphy Richards 2-Slice Toaster', '2-slice pop-up toaster with 7 browning levels. Cancel lift and defrost.', 1999, 2999, 90, 4.0, 34560],
  ['Wonderchef Nutri-Blend', '400W mixer grinder with 4 jars. Stainless steel blades, 3 speeds.', 3499, 4999, 120, 4.1, 34560],
  ['Milton Thermo Steel Flask 1L', 'Double wall vacuum insulation. 1L capacity, 24hr hot, 24hr cold.', 999, 1499, 500, 4.2, 123400],
  ['Cello Water Bottle 1L', 'BPA-free plastic water bottle. 1L, wide mouth, leak-proof cap.', 299, 499, 800, 3.9, 234500],
  ['Borosil Glass Bowl Set', 'Set of 3 borosilicate glass mixing bowls. Microwave and dishwasher safe.', 1299, 1999, 200, 4.3, 45670],
  ['GreenPan Non-Stick Frypan', '28cm non-stick frypan with Thermolon coating. Healthy ceramic, scratch resistant.', 2499, 3499, 140, 4.2, 34560],
  ['Prestige Induction Cooktop', '2000W induction cooktop with 10 presets. Touch control, auto shut-off.', 2499, 3499, 180, 4.1, 45670],
  ['Butterfly Mixer Grinder 750W', '750W mixer grinder with 3 jars. Stainless steel, super extractor.', 3299, 4499, 100, 4.3, 34560],
  ['Pigeon Folding Step Stool', 'ABS plastic folding stool. 2-step, 150kg capacity, anti-skid feet.', 1299, 1999, 200, 4.0, 23450],
  ['Hawkins 1.5L Pressure Cooker', 'Stainless steel 1.5L small pressure cooker. Ideal for dals and rice.', 1499, 2299, 120, 4.2, 34560],
  ['Bajaj 200W Hand Blender', '200W hand blender with stainless steel shaft. 2 speeds, detachable arm.', 1499, 2299, 100, 4.0, 23450],
  ['Philips HL7756 Mixer Grinder', '750W motor, 3 jars, overheat protection, turbo boost, fruit filter.', 4499, 5999, 80, 4.4, 34560],
  ['Usha 40L Storage Water Heater', '40L geyser with 2000W heating. Glass coated tank, safety thermostat.', 4999, 6999, 60, 4.1, 23450],
  ['Havells 600W Immersion Rod', '600W immersion water heater with copper element. Auto shut-off.', 399, 699, 500, 3.8, 123400],
  ['Croma 1.5L OTG Oven', '1.5L mini oven with 1000W. Perfect for small bakes and grilling.', 2999, 3999, 50, 3.9, 12340],
  ['Morphy Richards 300W Hand Mixer', '300W hand mixer with 5 speeds. Turbo boost, dough hooks, beaters.', 2499, 3499, 70, 4.1, 23450],
  ['Wonderchef 3-Ply Kadai', '3-layer stainless steel kadai with lid. 2L, induction compatible.', 1999, 2999, 90, 4.2, 23450],
  ['Milton Duo Lunch Box', '2-layer stainless steel lunch box. Leak-proof, insulated bag included.', 1499, 2299, 250, 4.0, 56780],
  ['Cello Thermal Mug 500ml', 'Double wall insulated travel mug. 500ml, spill-proof lid, powder coated.', 599, 999, 400, 3.9, 67890],
  ['Borosil Tea Pot 1L', 'Borosilicate glass teapot with stainless steel infuser. 1L capacity.', 999, 1499, 180, 4.2, 34560],
  ['GreenPan Ceramic Kadhai', '30cm ceramic coated kadhai with glass lid. Healthy non-stick, metal safe.', 2999, 3999, 70, 4.2, 23450],
  ['Prestige Electric Rice Cooker', '1.5L electric rice cooker with non-stick pot. Keep warm function, transparent lid.', 1499, 1999, 200, 4.1, 56780],
  ['Butterfly 1L Electric Kettle', 'Stainless steel 1L kettle with concealed element. 1500W, auto shut-off.', 699, 1199, 350, 3.9, 45670],
  ['Pigeon Gas Stove 2 Burner', '2-burner gas stove with brass burners. Auto ignition, powder coated body.', 2499, 3499, 120, 4.2, 34560],
  ['Hawkins 5L Futura Hard Anodized', 'Hard anodized 5L pressure cooker. Induction compatible, 2 pressure settings.', 4999, 6499, 55, 4.5, 23450],
  ['Bajaj 1200W Mixer Grinder', '1200W mixer grinder with 4 jars. Stainless steel, 3-speed, juicer.', 5499, 6999, 60, 4.2, 23450],
  ['Philips 2100W Hair Dryer', '2100W hair dryer with ionic care. 6 heat settings, diffuser, concentrator.', 1999, 2999, 150, 4.3, 34560],
  ['Usha 300W Iron', '300W steam iron with ceramic soleplate. Anti-drip, vertical steam, self-clean.', 999, 1499, 300, 4.0, 45670],
  ['Havells 6" Table Fan', '150mm table fan with 3 speeds. Noiseless operation, energy efficient.', 1299, 1999, 250, 4.1, 34560],
  ['Croma Air Fryer 4.5L', '4.5L digital air fryer with 8 presets. Sync finish, 1800W, recipe book.', 5999, 7999, 45, 4.3, 23450],
  ['Morphy Richards Iron 1500W', '1500W steam iron with non-stick soleplate. Spray mist, anti-drip.', 1499, 2299, 100, 4.0, 23450],
  ['Wonderchef 6-Bottle Wine Rack', 'Wooden wine bottle rack with 6 bottle capacity. Wall mountable design.', 1299, 1999, 80, 3.9, 12340],
  ['Milton 1L Water Bottle', 'Steel water bottle with push-pull cap. 1L, vacuum insulation, 24hr cold.', 799, 1199, 600, 4.1, 123400],
  ['Cello 50L Dustbin', '50L pedal dustbin with odour filter. Stainless steel, fingerprint resistant.', 2499, 3499, 90, 4.0, 23450],
  ['Borosil Microwave Bowl Set', 'Set of 3 microwave safe bowls with lids. 650ml, 900ml, 1200ml.', 1499, 2299, 140, 4.2, 34560],
  ['GreenPan Frying Pan Set', 'Set of 2 non-stick frying pans. 20cm + 28cm with ceramic coating.', 3999, 5499, 60, 4.2, 23450],
  ['Prestige Sandwich Maker', '700W sandwich maker with non-stick plates. 2 slices, ready in 3 minutes.', 1199, 1799, 180, 4.0, 34560],
  ['Butterfly 2L Electric Cooker', '2L electric cooker with steamer attachment. Keep warm function, 700W.', 2499, 3499, 70, 4.1, 23450],
  ['Pigeon Featherlite Iron', 'Lightweight 980g dry iron. 850W, non-stick soleplate, comfortable grip.', 499, 899, 400, 3.8, 56780],
  ['Hawkins 2L Pressure Pan', '2L hard anodized pressure pan with lid. Induction compatible, flat base.', 2999, 3999, 55, 4.3, 23450],
  ['Bajaj 800W Oven Toaster', '800W oven with 2 heating modes. 60min timer, removable crumb tray.', 2999, 3999, 50, 3.9, 12340],
  ['Philips 5000 Series Trimmer', 'Self-sharpening blades, 20 length settings, 90min runtime, washable.', 1799, 2499, 200, 4.3, 56780],
  ['Usha 60W Pedestal Fan', '400mm sweep, 60W, 3-speed, 120cm height. Sturdy with powder coated guard.', 3499, 4499, 80, 4.0, 23450],
  ['Havells Room Heater 2000W', '2000W PTC fan heater with thermostat. Overheat protection, tip-over switch.', 2499, 3499, 100, 4.1, 34560],
  ['Croma 10L Kitchen Waste Bin', '10L stainless steel step bin. Odour seal ring, removable inner bucket.', 1499, 2299, 120, 4.0, 23450],
  ['Morphy Richards 1200W Kettle', '1.5L stainless steel kettle. 1200W, cordless, 360° base, concealed element.', 1299, 1999, 150, 4.1, 34560],
  ['Wonderchef Chopper 500W', '500W electric chopper with 1L bowl. 2-speed, pulse, stainless steel blade.', 1999, 2999, 80, 4.0, 23450],
  ['Milton 3-Layer Tiffin', 'Stainless steel 3-layer tiffin with carrier bag. Leak-proof, warm food.', 1999, 2999, 120, 4.1, 34560],
  ['Cello 20L Storage Box', 'Plastic storage box with lid. 20L, clear body, stackable design.', 499, 899, 500, 3.8, 67890],
  ['Borosil Glass Jar Set', 'Set of 3 airtight glass jars. 500ml, 750ml, 1L. Bamboo lids.', 1499, 2299, 160, 4.1, 34560],
  ['GreenPan Stock Pot 5L', '5L stock pot ceramic non-stick. Glass lid, induction, oven safe 180°C.', 3499, 4999, 50, 4.2, 23450],
  ['Prestige Grill Sandwich Maker', '750W grill with non-stick grill plates. Floating hinge, lock indicator.', 2499, 3499, 65, 4.1, 23450],
  ['Butterfly 2-in-1 Iron', 'Steam + dry iron 1500W. Ceramic soleplate, spray, anti-drip, self-clean.', 1499, 2299, 100, 4.0, 34560],
  ['Pigeon 500W Hand Blender', '500W hand blender with whisk and chopper. Stainless steel shaft, 2-speed.', 1799, 2499, 70, 4.0, 23450],
  ['Hawkins 1L Baby Cooker', '1L small pressure cooker for baby food. Stainless steel, quick cooking.', 999, 1499, 140, 4.2, 34560],
  ['Bajaj 5L Hot Case', '5L electric lunch box with car adapter. 12V DC, 100W, keeps food hot.', 1499, 2299, 60, 3.9, 12340],
  ['Philips 3000W Geyser', '15L instant water heater. 3000W, thermostat, safety cut-off, wall mount.', 3999, 5499, 80, 4.3, 23450],
  ['Usha 25L Room Heater', '25L oil filled room heater. 2000W, adjustable thermostat, carry handle.', 4999, 6499, 40, 4.1, 12340],
  ['Havells 400W Exhaust Fan', '400mm exhaust fan with shutters. High suction, noiseless operation.', 2499, 3499, 90, 4.0, 23450],
  ['Croma 6" Wall Fan', '150mm wall fan with 3-speed. Aerodynamic blades, sweep 50°.', 1799, 2499, 120, 4.0, 23450],
  ['Morphy Richards 3-Jar Mixer', '3-jar mixer grinder 500W. Juicer, chutney, and grinding jars.', 2999, 3999, 75, 4.1, 23450],
  ['Wonderchef Induction Combo', 'Induction cooktop + 3-ply kadhai combo. 1800W, 10 presets, warranty.', 4999, 6999, 40, 4.2, 12340],
  ['Milton Thermosteel Lunch Box', '500ml steel lunch box with vacuum insulation. 6hr hot, leak-proof lid.', 1499, 2299, 160, 4.1, 34560],
  ['Cello Aqua 20L Water Bottle', '20L water dispenser bottle. BPA-free, wide mouth, easy clean.', 599, 899, 300, 3.9, 56780],
  ['Borosil Microwave Glass Tray', '36cm borosilicate glass microwave turntable plate. Replaceable, dishwasher safe.', 999, 1499, 150, 4.0, 23450],
  ['GreenPan 5-Piece Cookware Set', '5-piece set with 2 frypans, saucier, casserole, and stock pot.', 8999, 12999, 30, 4.4, 12340],
  ['Prestige 1000W Convection Oven', '1000W 20L OTG with convection. 4 heating modes, 90min timer.', 5499, 7499, 35, 4.2, 23450],
  ['Butterfly 750W Wet Grinder', '120W wet grinder with 2L drum. Tilting design, coconut scraper included.', 4499, 5999, 50, 4.1, 23450],
  ['Pigeon 1L Handy Steamer', '1L vegetable steamer for microwave. BPA-free, collapsible, dishwasher safe.', 699, 1199, 180, 3.9, 23450],
  ['Hawkins 5L Deep Fry Kadai', 'Hard anodized deep fry pan. 5L with lid and frying basket.', 2999, 3999, 70, 4.2, 23450],
  ['Bajaj 20W Ceiling Fan Regulator', '20W electronic fan regulator with LED indicator. Smooth speed control.', 299, 499, 600, 3.8, 123400],
];

const homeProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('home-kitchen', i),
  brand: homeBrands[i % homeBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 4).map((f: string) => f.trim()).filter(Boolean),
  is_featured: false,
});

// BOOKS — 60 products
const bookBrands = ['Penguin', 'HarperCollins', 'Rupa', 'Westland', 'Bloomsbury', 'Oxford', 'Pearson', 'S Chand', 'Arihant', 'MTG', 'Disha', 'Oswaal', 'NIV', 'Roli Books', 'Aleph'];
const bookItems = [
  ['Rich Dad Poor Dad - Robert Kiyosaki', 'The #1 personal finance bestseller. Learn about assets, liabilities, and financial independence.', 349, 550, 1000, 4.6, 345678],
  ['The Alchemist - Paulo Coelho', 'The enchanting story of Santiago, an Andalusian shepherd boy who yearns to travel.', 299, 450, 2000, 4.5, 567890],
  ['Atomic Habits - James Clear', 'Tiny changes, remarkable results. The definitive guide to building good habits.', 399, 599, 1500, 4.7, 456789],
  ['Think and Grow Rich - Napoleon Hill', 'Classic personal development book based on 20 years of research. Timeless principles.', 199, 350, 1800, 4.3, 234567],
  ['The Power of Your Subconscious Mind', 'Unlock the power of your mind to achieve success and happiness. Life-changing.', 199, 350, 1600, 4.2, 189000],
  ['Wings of Fire - APJ Abdul Kalam', 'The inspiring autobiography of Dr. APJ Abdul Kalam, former President of India.', 299, 450, 1200, 4.8, 345600],
  ['India 2025 - Various', 'Annual reference book with comprehensive info on India. Updated edition.', 249, 395, 800, 4.0, 123400],
  ['The Monk Who Sold His Ferrari', 'A powerful and inspiring story about finding your true purpose and passion.', 249, 399, 1400, 4.3, 234500],
  ['Sapiens - Yuval Noah Harari', 'A brief history of humankind. 100,000 years of history in one compelling book.', 499, 699, 900, 4.6, 345600],
  ['Homo Deus - Yuval Noah Harari', 'The incredible story of how humans conquered the world and our future.', 549, 799, 600, 4.4, 234500],
  ['1984 - George Orwell', 'The dystopian masterpiece that continues to resonate with modern readers.', 249, 399, 1500, 4.5, 456700],
  ['The Great Gatsby - F. Scott Fitzgerald', 'The classic American novel of the Jazz Age. Love, wealth, and the American dream.', 199, 299, 1200, 4.2, 345600],
  ['To Kill a Mockingbird', 'Harper Lee\'s Pulitzer Prize-winning masterpiece of race, injustice and childhood.', 349, 499, 1000, 4.6, 345600],
  ['The Psychology of Money', 'Timeless lessons on wealth, greed, and happiness. How money really works.', 349, 499, 1300, 4.5, 345600],
  ['Ikigai - The Japanese Secret', 'Discover your ikigai — the reason for being. A practical guide to long life.', 399, 599, 1100, 4.4, 234500],
  ['Do Epic Wins - Shrikant Karwa', 'Become a public speaker, implementer, and communication expert. Practical guide.', 249, 399, 500, 4.0, 123400],
  ['The Secret - Rhonda Byrne', 'The life-changing self-help phenomenon. The law of attraction explained.', 349, 499, 1400, 4.1, 456700],
  ['How to Win Friends & Influence People', 'Dale Carnegie\'s timeless classic. The art of dealing with people masterfully.', 249, 399, 2000, 4.4, 567800],
  ['The 7 Habits of Highly Effective People', 'Stephen Covey\'s principle-centered approach for solving personal problems.', 399, 599, 1200, 4.5, 345600],
  ['Man\'s Search for Meaning - Viktor Frankl', 'Psychiatrist Viktor Frankl\'s memoir of survival in Nazi camps and his theory.', 299, 449, 900, 4.7, 234500],
  ['The Subtle Art of Not Giving a F*ck', 'Mark Manson\'s counterintuitive approach to living a good life.', 349, 499, 1600, 4.3, 567800],
  ['Gone Girl - Gillian Flynn', 'The psychological thriller that defined a decade. A wife disappears.', 399, 599, 800, 4.2, 345600],
  ['The Silent Patient - Alex Michaelides', 'A woman shoots her husband. Then never speaks another word. Page turner.', 349, 499, 900, 4.4, 345600],
  ['The Girl on the Train - Paula Hawkins', 'A gripping psychological thriller about marriage, obsession, and betrayal.', 299, 399, 1000, 4.1, 234500],
  ['Where the Crawdads Sing', 'A beautiful coming-of-age story and a murder mystery in the marsh.', 399, 549, 700, 4.6, 234500],
  ['The India Story - Bimal Jalan', 'Insightful analysis of India\'s political and economic journey by a former governor.', 599, 899, 300, 4.3, 123400],
  ['India After Gandhi - Ramachandra Guha', 'The definitive history of India since independence. Comprehensive and engaging.', 999, 1499, 400, 4.7, 123400],
  ['The Argumentative Indian - Amartya Sen', 'Nobel laureate\'s brilliant collection of essays on India\'s intellectual heritage.', 599, 899, 350, 4.4, 18900],
  ['An Era of Darkness - Shashi Tharoor', 'The British Empire in India. A comprehensive account of colonial rule.', 399, 599, 500, 4.3, 23450],
  ['The Hindus - Wendy Doniger', 'An alternative history of the Hindu people. Enlightening and provocative.', 899, 1299, 200, 4.0, 12340],
  ['Why I Am a Hindu - Shashi Tharoor', 'A thoughtful exploration of the world\'s oldest religion.', 399, 599, 400, 4.2, 23450],
  ['NCERT Science Class 10', 'Comprehensive science textbook for Class 10 CBSE. Latest edition, full color.', 199, 299, 2000, 4.3, 567800],
  ['NCERT Mathematics Class 12 Part 1', 'Standard math textbook for CBSE Class 12. Authorized NCERT publication.', 149, 249, 1800, 4.1, 456700],
  ['Concise Physics Class 10 ICSE', 'Simplified physics textbook for ICSE. Formulas, derivations, solved examples.', 449, 599, 800, 4.2, 234500],
  ['Mathematics for JEE Advanced', 'Comprehensive JEE preparation guide. 2000+ problems with detailed solutions.', 1299, 1899, 400, 4.5, 123400],
  ['Organic Chemistry by O P Tandon', 'Bestseller organic chemistry book for JEE and NEET. Thorough coverage.', 899, 1299, 500, 4.4, 234500],
  ['Physical Chemistry by P Bahadur', 'Numerical chemistry book for JEE. 1500+ problems with step-by-step solutions.', 699, 999, 350, 4.3, 189000],
  ['Quantitative Aptitude - R S Aggarwal', 'The bestselling aptitude book for competitive exams. 5000+ questions.', 599, 899, 1500, 4.3, 456700],
  ['English Grammar & Composition - Wren & Martin', 'The classic English grammar book used by generations of Indian students.', 399, 599, 1200, 4.4, 345600],
  ['Lucent General Knowledge 2026', 'Up-to-date GK book for competitive exams. Current affairs and static GK.', 249, 399, 2000, 4.1, 567800],
  ['Manorama Yearbook 2026', 'Comprehensive yearbook with current events, science, sports, and world records.', 499, 699, 800, 4.2, 234500],
  ['The Room on the Roof - Ruskin Bond', 'Rusty\'s story of growing up in Dehradun. Timeless classic for young readers.', 199, 299, 600, 4.5, 234500],
  ['Malgudi Days - R K Narayan', 'The unforgettable stories of Malgudi. Swami, his friends, and adventures.', 299, 449, 700, 4.6, 345600],
  ['God of Small Things - Arundhati Roy', 'Booker Prize-winning novel about family, love, and social norms in Kerala.', 399, 599, 400, 4.3, 234500],
  ['Midnight\'s Children - Salman Rushdie', 'Booker of Bookers winning magical realist novel of India\'s independence.', 499, 699, 300, 4.4, 123400],
  ['Train to Pakistan - Khushwant Singh', 'The moving story of Partition told through a small border village.', 299, 449, 500, 4.5, 234500],
  ['The White Tiger - Aravind Adiga', 'Man Booker Prize winner. Darkly humorous tale of modern India.', 349, 499, 400, 4.2, 123400],
  ['Interpreter of Maladies - Jhumpa Lahiri', 'Pulitzer Prize-winning short stories about the Indian diaspora experience.', 349, 499, 500, 4.4, 234500],
  ['The Guide - R K Narayan', 'The story of Raju, a corrupt tourist guide turned holy man. Classic.', 249, 399, 400, 4.5, 234500],
  ['Ramayana - C Rajagopalachari', 'The timeless epic retold simply and beautifully for all generations.', 299, 449, 800, 4.7, 345600],
  ['Mahabharata - C Rajagopalachari', 'The complete Mahabharata retold in simple English. Comprehensive edition.', 399, 599, 600, 4.7, 345600],
  ['Bhagavad Gita - As It Is', 'Complete edition with translations. Essential spiritual guide for millions.', 499, 699, 900, 4.6, 456700],
  ['Autobiography of a Yogi - Yogananda', 'The spiritual classic that introduced millions to meditation and yoga.', 399, 559, 500, 4.7, 234500],
  ['The Discovery of India - Jawaharlal Nehru', 'India\'s first Prime Minister\'s brilliant exploration of Indian civilization.', 599, 899, 400, 4.5, 123400],
  ['Glimpses of World History - Jawaharlal Nehru', 'Letters to Indira on world history. Engaging and educational.', 699, 999, 350, 4.4, 123400],
  ['The Great Indian Novel - Shashi Tharoor', 'A hilarious retelling of Mahabharata as India\'s political history.', 349, 499, 300, 4.2, 18900],
  ['Chanakya Neeti - Radhakrishnan Pillai', 'Chanakya\'s timeless wisdom for modern life. Leadership and strategy.', 249, 399, 700, 4.3, 234500],
  ['Stay Hungry Stay Foolish - Rashmi Bansal', 'Inspiring stories of 25 IIM Ahmedabad entrepreneurs who chose their path.', 299, 449, 600, 4.1, 234500],
  ['Connect the Dots - Rashmi Bansal', '20 inspiring entrepreneur stories of those who followed their dreams.', 299, 449, 500, 4.0, 189000],
  ['The Art of War - Sun Tzu', 'The ancient Chinese military treatise now used for business and life strategy.', 99, 199, 2000, 4.1, 456700],
];

const bookProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('books', i),
  brand: bookBrands[i % bookBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 3).map((f: string) => f.trim()).filter(Boolean),
  is_featured: false,
});

// BEAUTY — 60 products
const beautyBrands = ['Lakme', 'Maybelline', 'Nykaa', 'L\'Oreal', 'Garnier', 'Ponds', 'Nivea', 'Dove', 'Himalaya', 'Mamaearth', 'Biotique', 'Forest Essentials', 'Kama Ayurveda', 'Plum', 'Mcaffeine'];
const beautyItems = [
  ['Lakme Absolute Skin Gloss Kit', 'Complete skin gloss kit with 5 shades. Lightweight, long-lasting lip gloss set.', 899, 1299, 300, 4.1, 56780],
  ['Maybelline Fit Me Foundation', 'Liquid foundation with SPF 18. Natural finish, 18 shade range, medium coverage.', 599, 899, 500, 4.2, 123400],
  ['Nykaa Ultra Matte Lipstick', 'Long-wear matte lipstick with 12-hour stay. Creamy, non-drying formula.', 599, 899, 400, 4.0, 89000],
  ['L\'Oreal Paris Eyeliner', 'Waterproof liquid eyeliner with precision tip. Intense black, smudge-free.', 499, 799, 600, 4.1, 123400],
  ['Garnier Micellar Water 400ml', 'No-rinse cleansing water for sensitive skin. Removes makeup, cleanses, soothes.', 449, 699, 700, 4.3, 234500],
  ['Ponds Age Miracle Cream', 'Anti-aging day cream with SPF 15. Retinol complex, visible results in 2 weeks.', 299, 499, 800, 4.0, 189000],
  ['Nivea Body Lotion 400ml', 'Deep moisture body lotion with almond oil. 48hr hydration, non-greasy.', 349, 499, 1000, 4.2, 345600],
  ['Dove Intense Repair Shampoo', 'Deep repair shampoo with Keratin Actives. Restores damaged hair strength.', 349, 499, 1200, 4.1, 456700],
  ['Himalaya Neem Face Wash', 'Natural neem-based face wash for acne-prone skin. Daily use, gentle cleanse.', 149, 249, 2000, 4.0, 567800],
  ['Mamaearth Vitamin C Serum', '10% Vitamin C serum with hyaluronic acid. Brightens and even skin tone.', 499, 799, 600, 4.2, 234500],
  ['Biotique Bio Cucumber Toner', 'Alcohol-free toner with cucumber extract. Tightens pores, refreshes skin.', 199, 299, 800, 4.0, 345600],
  ['Forest Essentials Sandalwood Rose', 'Luxury facial mist with pure sandalwood and rose water. Hydrating and refreshing.', 895, 1295, 200, 4.4, 123400],
  ['Kama Ayurveda Rose Water', 'Pure rose water facial toner. Distilled from Damask roses. Cooling and soothing.', 395, 595, 300, 4.5, 189000],
  ['Plum Green Tea Face Wash', 'Green tea and aloe face wash. Anti-pollution, daily use, gentle on skin.', 299, 449, 500, 4.1, 234500],
  ['Mcaffeine Coffee Face Scrub', 'Coffee-based face and body scrub. Exfoliates, reduces cellulite, stimulates blood flow.', 349, 499, 400, 4.0, 189000],
  ['Lakme 9 to 5 Lipstick', 'Long-wear lipstick that stays 9 hours. Enriched with shea butter.', 399, 599, 500, 4.1, 123400],
  ['Maybelline Colossal Kajal', 'Intense black kajal with collagen and vitamin E. Waterproof, smudge-proof.', 299, 449, 600, 4.3, 234500],
  ['Nykaa Setting Spray', 'Makeup setting spray with micro-fine mist. 8-hour hold, matte finish.', 499, 799, 350, 4.0, 123400],
  ['L\'Oreal Professional Hair Oil', 'Professional grade argan oil treatment. Frizz control, shine boost, heat protect.', 699, 999, 300, 4.2, 189000],
  ['Garnier Men Face Wash', 'Charcoal face wash for men. Removes dirt, oil, and impurities.', 249, 399, 800, 4.0, 234500],
  ['Ponds White Beauty Cream', 'Day cream with vitamin C and SPF 30. Brightens and protects from sun.', 249, 399, 700, 3.9, 345600],
  ['Nivea Men Shaving Cream', 'Rich shaving cream with chamomile. Smooth glide, razor protection.', 249, 399, 600, 4.1, 189000],
  ['Dove Body Wash 250ml', 'Moisture-rich body wash with NutriumMoisture. Leaves skin soft and smooth.', 299, 449, 1000, 4.1, 345600],
  ['Himalaya Purifying Neem Pack', 'Natural clay face pack with neem and turmeric. Deep cleans, reduces acne.', 199, 299, 500, 3.9, 234500],
  ['Mamaearth Hair Mask', 'Onion oil hair mask for hair growth. Reduces hair fall, improves thickness.', 599, 899, 350, 4.2, 189000],
  ['Biotique Body Lotion', 'Advanced ayurvedic body lotion with wheat germ and almond. Non-sticky.', 249, 399, 400, 4.0, 123400],
  ['Forest Essentials Night Cream', 'Luxurious night cream with 24k gold and almond oil. Rejuvenates skin overnight.', 1795, 2495, 100, 4.5, 56780],
  ['Kama Ayurveda Kumkumadi Oil', 'Traditional Ayurvedic face oil. Brightens, moisturizes, anti-aging, 30ml.', 1195, 1695, 150, 4.6, 89000],
  ['Plum Body Lovin\' Lotion', 'Vanilla vibes body lotion. Shea butter and coconut oil, 48hr moisture.', 399, 599, 400, 4.2, 123400],
  ['Mcaffeine Hair Growth Kit', 'Coffee-based shampoo, conditioner, and serum. Caffeine + biotin for hair growth.', 999, 1499, 200, 4.0, 56780],
  ['Lakme Eyeconic Kajal', 'Waterproof kajal with 24hr wear. Intense black, retractable pencil.', 399, 599, 500, 4.1, 123400],
  ['Maybelline Lash Sensational', 'Mascara with fanning brush. Lengthens, volumizes, dramatic lash effect.', 449, 699, 600, 4.2, 189000],
  ['Nykaa Compact Powder', 'Pressed setting powder with SPF 25. Matte finish, 3 shades, seamless blend.', 599, 899, 400, 4.0, 123400],
  ['L\'Oreal Revitalift Night Cream', 'Anti-wrinkle night cream with Pro-Retinol and Vitamin C. Replenishes overnight.', 899, 1299, 250, 4.3, 189000],
  ['Garnier Skin Naturals BB Cream', 'All-in-one BB cream with SPF 30. Moisturizer, primer, foundation, sunscreen.', 399, 599, 500, 4.0, 234500],
  ['Ponds Super Light Gel', 'Oil-free moisturizer with hyaluronic acid. Lightweight, 24hr hydration.', 299, 449, 700, 4.1, 345600],
  ['Nivea Sun Protect SPF 50', 'Water-resistant sunscreen lotion with SPF 50 PA+++. Broad spectrum protection.', 449, 649, 600, 4.2, 234500],
  ['Dove Anti-Dandruff Shampoo', 'Anti-dandruff shampoo with zinc pyrithione. 7 out of 10 dermatologists recommend.', 349, 499, 900, 4.0, 345600],
  ['Himalaya Gentle Exfoliating Scrub', 'Walnut and papaya face scrub. Removes dead cells, reveals glow.', 199, 299, 700, 4.0, 234500],
  ['Mamaearth Aloe Vera Gel', 'Pure aloe vera gel for face and body. Soothing, moisturizing, non-sticky.', 299, 449, 600, 4.1, 234500],
  ['Biotique Shampoo 200ml', 'Ayurvedic shampoo with bhringraj and amla. Natural hair cleanser, no sulfates.', 249, 399, 500, 3.9, 189000],
  ['Forest Essentials Face Wash', 'Luxury face wash with honey and turmeric. Ayurvedic formula, gentle cleanse.', 695, 995, 150, 4.4, 89000],
  ['Kama Ayurveda Almond Oil', 'Pure sweet almond oil for skin and hair. Rich in vitamin E, 100ml.', 595, 845, 200, 4.5, 123400],
  ['Plum Lip Balm Trio', 'Set of 3 tinted lip balms. Natural ingredients, SPF 15, moisturizing.', 599, 899, 250, 4.1, 56780],
  ['Mcaffeine Body Scrub', 'Coffee-based body scrub with sea salt. Exfoliates, firms, and energizes skin.', 449, 649, 300, 4.0, 123400],
  ['Lakme Sunscreen SPF 50', 'Gel sunscreen with SPF 50. Non-greasy, water-resistant, broad spectrum.', 399, 599, 400, 4.0, 189000],
  ['Maybelline Eye Shadow Palette', '12-shade eye shadow palette with matte and shimmer. Highly pigmented.', 999, 1499, 250, 4.3, 123400],
  ['Nykaa Skin Serum Foundation', 'Buildable coverage foundation with skincare benefits. Vitamin C and hyaluronic acid.', 799, 1199, 200, 4.1, 56780],
  ['L\'Oreal Total Repair Shampoo', 'Total damage repair shampoo. Restores, nourishes, rejuvenates damaged hair.', 449, 649, 500, 4.1, 234500],
  ['Garnier Body Tonic Lotion', 'Firming body lotion with green tea and caffeine. Reduces cellulite appearance.', 349, 499, 400, 3.9, 123400],
  ['Ponds Age Miracle Night Cream', 'Anti-aging night cream with retinol. Reduces wrinkles in just 2 weeks.', 349, 549, 500, 4.0, 189000],
  ['Nivea Lip Care SPF 15', 'Moisturizing lip balm with shea butter. SPF 15 protection, 4.8g.', 99, 199, 2000, 3.8, 567800],
  ['Dove Oxygen Moisture Shampoo', 'Volumizing shampoo for fine hair. Adds body without weighing down.', 349, 499, 600, 4.0, 234500],
  ['Himalaya Clear Complexion Mask', 'Clay face mask for glowing skin. Turmeric, neem, and multani mitti.', 149, 249, 600, 3.9, 234500],
  ['Mamaearth Ubtan Body Wash', 'Turmeric and saffron body wash. Brightens and exfoliates naturally.', 349, 499, 400, 4.1, 123400],
  ['Biotique Sunscreen SPF 40', 'Ayurvedic sunscreen with carrot and walnut. PA+++, water-resistant, 100ml.', 299, 449, 350, 4.0, 123400],
  ['Forest Essentials Hair Oil', 'Luxury hair oil with amla, bhringraj, and coconut. Ayurvedic hair growth.', 995, 1495, 120, 4.3, 56780],
  ['Kama Ayurveda Rejuvenating Serum', 'Botanical face serum with 24k gold. Brightening and anti-aging, 20ml.', 1595, 2250, 80, 4.6, 34560],
  ['Plum Green Tea Day Cream', 'Green tea daily moisturizer with SPF 35. Lightweight, matte finish.', 499, 749, 300, 4.1, 123400],
  ['Mcaffeine Deo Spray', 'Coffee-infused deodorant spray. 24hr odor protection, aluminum-free.', 249, 399, 500, 3.8, 189000],
];

const beautyProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('beauty', i),
  brand: beautyBrands[i % beautyBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 4).map((f: string) => f.trim()).filter(Boolean),
  is_featured: false,
});

// SPORTS & OUTDOORS — 62 products
const sportsBrands = ['Nike', 'Adidas', 'Puma', 'Decathlon', 'Reebok', 'Skechers', 'Campus', 'Bounce', 'Wildcraft', 'Quechua', 'Force 10', 'Cosco', 'SG', 'MRF', 'Yonex'];
const sportsItems = [
  ['Nike Air Max Impact 4', 'Men\'s basketball shoes with Max Air unit. Breathable mesh, rubber outsole.', 8995, 11995, 60, 4.4, 23450],
  ['Adidas Ultraboost Light', 'Men\'s running shoes with Light BOOST midsole. Primeknit upper, continental rubber.', 12999, 15999, 35, 4.6, 34560],
  ['Puma RS-X3 Puzzle', 'Men\'s chunky sneakers with mesh and leather upper. RS cushioning, retro style.', 7999, 10999, 45, 4.3, 12340],
  ['Decathlon Quechua MH500 Tent', '2-person waterproof tent. Easy setup, 2-second technology, 10°C comfort.', 5999, 7999, 40, 4.5, 23450],
  ['Reebok Classic Leather', 'Men\'s classic leather trainers. Soft leather upper, EVA midsole, timeless design.', 6999, 8999, 80, 4.3, 34560],
  ['Skechers Go Walk 5', 'Men\'s slip-on walking shoes. Ultra GO cushioning, breathable knit, machine washable.', 5999, 7999, 100, 4.4, 56780],
  ['Campus Vector Running Shoes', 'Men\'s lightweight running shoes with cushioned sole. Breathable mesh, lace-up.', 1499, 2499, 300, 4.0, 123400],
  ['Bounce Women Yoga Set', '2-piece yoga set with sports bra and leggings. Nylon-spandex, moisture wicking.', 1999, 2999, 120, 4.1, 34560],
  ['Wildcraft 40L Backpack', '40L hiking backpack with rain cover. Padded hip belt, hydration compatible, multiple compartments.', 2999, 4499, 100, 4.4, 56780],
  ['Quechua MH100 Hiking Shoes', 'Men\'s waterproof hiking shoes. Comfortable, grippy outsole, 5°C to 25°C.', 3499, 4999, 80, 4.2, 34560],
  ['Force 10 Dumbbell Set 10kg', 'PVC dumbbell set with 2 x 5kg. Ergonomic grip, hex shape, home gym.', 2499, 3499, 120, 4.0, 56780],
  ['Cosco Football Size 5', 'Machine stitched football with PU cover. Butyl bladder, excellent bounce, match play.', 999, 1499, 200, 4.1, 123400],
  ['SG Cricket Bat Grade 1', 'Kashmir willow cricket bat full size. Pre-pressed, toe guard, covered handle.', 3499, 4999, 60, 4.3, 56780],
  ['MRF Cricket Ball', 'Leather cricket ball for match play. Hand-stitched, 156g, 22.4cm circumference.', 599, 999, 400, 4.2, 123400],
  ['Yonex Mavis 350 Shuttlecock', 'Nylon shuttlecock with high durability. Consistent flight, tournament quality.', 499, 799, 500, 4.1, 234500],
  ['Nike Dri-FIT T-Shirt', 'Men\'s training t-shirt with Dri-FIT technology. Sweat-wicking, lightweight, regular fit.', 2499, 3499, 200, 4.2, 123400],
  ['Adidas 3-Stripes Shorts', 'Men\'s training shorts with AEROREADY. 3-stripe design, elastic waist, mesh briefs.', 1999, 2999, 250, 4.1, 189000],
  ['Puma Training Socks Pack 6', 'Pack of 6 ankle socks. Cotton blend, cushioned sole, arch support.', 999, 1499, 500, 4.0, 345600],
  ['Decathlon Foam Roller 33cm', 'High-density foam roller for muscle recovery. 33cm length, firm, includes guide.', 999, 1499, 150, 4.1, 56780],
  ['Reebok Gym Bag Medium', 'Medium gym bag with separate shoe compartment. Water-resistant, 40L capacity.', 3499, 4999, 60, 4.2, 23450],
  ['Skechers Max Cushioning Elite', 'Men\'s running shoes with Ultra Go cushioning. Knit upper, arch fit, air cooled.', 7999, 10999, 40, 4.3, 23450],
  ['Wildcraft Duffel Bag 60L', '60L waterproof duffel bag with shoulder strap. Roll-top closure, PVC material.', 3999, 5499, 50, 4.3, 23450],
  ['Force 10 Skipping Rope', 'Speed skipping rope with ball bearings. Adjustable 3m cable, foam handles.', 299, 499, 800, 3.9, 345600],
  ['Cosco Badminton Set', '4-player badminton set with 2 rackets, 3 shuttlecocks, net, poles.', 2499, 3499, 70, 4.0, 56780],
  ['SG Cricket Helmet', 'Premium cricket helmet with steel grill. Lightweight, adjustable, padded interior.', 2499, 3499, 50, 4.2, 34560],
  ['MRF Batting Gloves', 'Professional batting gloves with foam protection. PVC shell, cotton lining.', 1499, 2299, 80, 4.1, 23450],
  ['Yonex Badminton Racket', 'Isometric head graphite racket. Lightweight 85g, pre-strung, with cover.', 2999, 4499, 90, 4.3, 56780],
  ['Nike Pro Training Shorts', 'Tight compression shorts with Dri-FIT. Elastic waist, 9-inch inseam.', 2999, 3999, 140, 4.2, 67890],
  ['Adidas Climalite Yoga Mat', 'Premium yoga mat 6mm thick. Extra grip, closed cell, includes carry strap.', 3499, 4999, 80, 4.1, 34560],
  ['Puma Baseball Cap', 'Classic 6-panel baseball cap with embroidered logo. Adjustable back, pre-curved brim.', 999, 1499, 400, 4.0, 189000],
  ['Decathlon Easybreath Mask', 'Full-face snorkeling mask with integrated GoPro mount. Anti-fog, 180° visibility.', 2499, 3499, 60, 4.4, 34560],
  ['Force 10 Push Up Stand', 'Push up bars with foam grip handles. Anti-skid, collapsible, max load 150kg.', 499, 799, 350, 4.0, 123400],
  ['Cosco Table Tennis Bat', 'ITTF approved table tennis bat with 2mm rubber. Wooden blade, pimples out.', 599, 999, 300, 4.0, 234500],
  ['Wildcraft Thermals Set', 'Men\'s thermal wear set. Fleece-lined, moisture-wicking, for cold weather.', 1999, 2999, 100, 4.2, 34560],
  ['Reebok Sports Water Bottle 750ml', 'BPA-free sports bottle with straw and squeeze. 750ml, leak-proof, easy grip.', 499, 799, 500, 4.0, 234500],
  ['Skechers Women Yoga Pants', 'High-waist yoga leggings with tummy control. 4-way stretch, squat proof.', 2999, 4499, 120, 4.2, 56780],
  ['Campus Trekking Shoes', 'Men\'s waterproof trekking shoes with ankle support. Anti-slip outsole, cushioned.', 2499, 3499, 80, 4.0, 34560],
  ['Bounce Gym Gloves', 'Fitness gloves with gel padding. Breathable back, velcro strap, finger loops.', 499, 799, 300, 3.9, 123400],
  ['Force 10 Ab Roller', 'Ab roller with knee pad. Dual wheel, foam handle, stabilising core trainer.', 449, 749, 350, 4.0, 234500],
  ['SG Wicket Keeping Gloves', 'Professional wicket keeping gloves with PU foam. Full finger protection, cotton lining.', 2999, 3999, 40, 4.2, 23450],
  ['Yonex Badminton Shoes', 'Professional badminton shoes with power cushion. Lightweight, non-marking sole.', 4999, 6999, 45, 4.4, 34560],
  ['Nike Women Sports Bra', 'Medium support sports bra with Dri-FIT. Racerback, pullover style, elastic band.', 2499, 3499, 150, 4.1, 56780],
  ['Adidas Adilette Slides', 'Iconic 3-stripe pool slides with cloudfoam footbed. Cushioned, slip-on, everyday wear.', 2499, 3499, 300, 4.2, 234500],
  ['Puma India Home Jersey 2025', 'Official India football jersey with Dri-FIT. Replica design, regular fit.', 2999, 4499, 80, 4.3, 34560],
  ['Decathlon Swim Set', 'Swim goggles + swim cap + swim bag set. Anti-fog, UV protection, silicone cap.', 999, 1499, 150, 4.0, 56780],
  ['Wildcraft Jacket Insulated', 'Men\'s insulated jacket with heat tech. Water repellent, packable, winter wear.', 4999, 6999, 50, 4.3, 23450],
  ['Cosco Basketball 7', 'Rubber basketball size 7 with nylon winding. Indoor/outdoor, good grip.', 1499, 2299, 150, 4.1, 123400],
  ['MRF Tennis Ball', 'Premium tennis ball with felt cover. Standard bounce, ITF approved, 3-ball pack.', 349, 549, 600, 4.0, 234500],
  ['Reebok Weightlifting Belt', 'Leather weightlifting belt with double prong. 4-inch width, back support.', 2499, 3499, 60, 4.2, 34560],
  ['Skechers Go Run Consistent', 'Men\'s road running shoes with M-strike. Ultra Go cushioning, breathable mesh.', 5999, 7999, 70, 4.3, 34560],
  ['Campus Half Sleeves T-Shirt', 'Men\'s gym t-shirt with racerback. Quick dry, moisture wicking, slim fit.', 499, 899, 400, 3.8, 234500],
  ['Bounce Leg Resistance Bands', 'Set of 3 leg resistance bands. Different tension levels, for glute and leg training.', 399, 699, 400, 3.9, 189000],
  ['Force 10 Medicine Ball 5kg', '5kg medicine ball with textured surface. Slam proof, for core and strength training.', 1499, 2299, 60, 4.0, 34560],
  ['SG Cricket Pads', 'Professional cricket leg guards with high density foam. Adjustable straps, lightweight.', 3499, 4999, 30, 4.3, 23450],
  ['Yonex GR303 Badminton Racket', 'Graphite racket with isometric head. Medium flex, suitable for beginners to intermediate.', 1499, 2299, 100, 4.1, 56780],
  ['Nike Victory Golf Ball Pack 6', 'Soft feel golf balls with low compression. 6 pack, for swing speeds < 85mph.', 2499, 3499, 80, 4.0, 23450],
  ['Adidas Performance Backpack', 'Team issue backpack with ventilated compartments. 30L, padded laptop sleeve.', 4499, 5999, 60, 4.2, 34560],
  ['Puma MotorSport Gloves', 'Half-finger driving gloves with silicone grip. Mesh back, touch screen compatible.', 1499, 2299, 80, 3.9, 12340],
  ['Decathlon Yoga Block 2-Pack', 'Set of 2 EVA foam yoga blocks. 15 x 10 x 7.5cm, lightweight and sturdy.', 499, 799, 200, 4.0, 67890],
  ['Wildcraft Sleeping Bag', '3-season sleeping bag comfort rated 5°C. Mummy shape, synthetic fill, 2.3kg.', 3999, 5499, 40, 4.3, 23450],
  ['Cosco Tennis Racket', 'Aluminum tennis racket pre-strung. Lightweight, vibration dampener, with cover.', 1999, 2999, 60, 4.0, 56780],
];

const sportsProduct = (data: any[], i: number): ProductInput => ({
  name: data[0], description: data[1], price: data[2] as unknown as number,
  compare_price: data[3] as unknown as number, images: pickImg('sports-outdoors', i),
  brand: sportsBrands[i % sportsBrands.length], count_in_stock: data[4] as unknown as number,
  rating: data[5] as unknown as number, num_reviews: data[6] as unknown as number,
  features: (data[1] as string).split('.').slice(0, 4).map((f: string) => f.trim()).filter(Boolean),
  is_featured: false,
});

// Build product data
electronicsItems.forEach((d, i) => allProducts.push(electronicsProduct(d, i)));
fashionItems.forEach((d, i) => allProducts.push(fashionProduct(d, i)));
homeItems.forEach((d, i) => allProducts.push(homeProduct(d, i)));
bookItems.forEach((d, i) => allProducts.push(bookProduct(d, i)));
beautyItems.forEach((d, i) => allProducts.push(beautyProduct(d, i)));
sportsItems.forEach((d, i) => allProducts.push(sportsProduct(d, i)));

console.log(`Total products to seed: ${allProducts.length}`);

const catSlug = (idx: number): string => {
  const total = allProducts.length;
  const electronicsEnd = electronicsItems.length;
  const fashionEnd = electronicsEnd + fashionItems.length;
  const homeEnd = fashionEnd + homeItems.length;
  const booksEnd = homeEnd + bookItems.length;
  const beautyEnd = booksEnd + beautyItems.length;

  if (idx < electronicsEnd) return 'electronics';
  if (idx < fashionEnd) return 'fashion';
  if (idx < homeEnd) return 'home-kitchen';
  if (idx < booksEnd) return 'books';
  if (idx < beautyEnd) return 'beauty';
  return 'sports-outdoors';
};

async function seed500Products() {
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  if (count && count >= 500) {
    console.log(`Already have ${count} products (target: 500). Skipping seed.`);
    return;
  }

  const { data: categories } = await supabase.from('categories').select('*');
  if (!categories || categories.length === 0) {
    console.log('No categories found. Run the main seed first.');
    return;
  }

  const catMap: Record<string, string> = {};
  categories.forEach((c: any) => { catMap[c.slug] = c.id; });

  const existingCount = count || 0;
  const needed = 500 - existingCount;
  const toInsert = allProducts.slice(0, needed);

  if (toInsert.length === 0) {
    console.log('All products already seeded.');
    return;
  }

  // Insert in batches of 50 to avoid timeouts
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize).map((p, j) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      compare_price: p.compare_price,
      images: p.images,
      brand: p.brand,
      count_in_stock: p.count_in_stock,
      rating: p.rating,
      num_reviews: p.num_reviews,
      features: p.features,
      is_featured: p.is_featured,
      category_id: catMap[catSlug(existingCount + i + j)],
      created_at: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('products').insert(batch);
    if (error) {
      console.error('Batch insert error:', error);
      console.log(`Inserted ${totalInserted} before error.`);
      return;
    }
    totalInserted += batch.length;
    console.log(`Batch ${Math.ceil((i + batchSize) / batchSize)}/${Math.ceil(toInsert.length / batchSize)}: Inserted ${totalInserted}/${toInsert.length} products`);
  }

  console.log(`\nDone! Added ${totalInserted} products. Total: ${(count || 0) + totalInserted}`);
}

seed500Products().catch(console.error);
