/**
 * VoltCraft catalogue.
 *
 * PLACEHOLDER DATA. Every product, specification, stock count and price below
 * is illustrative — written to be plausible for the Nigerian maker market, not
 * taken from VoltCraft's real stock list. Swap this module for the real
 * catalogue (or point `getProducts` at a CMS/database) before going live; every
 * consumer goes through the helpers at the bottom of this file, so nothing else
 * needs to change.
 */

export type CategorySlug =
  | "dev-boards"
  | "components"
  | "sensors"
  | "test-measurement"
  | "soldering"
  | "power"
  | "prototyping"
  | "workbench";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
  /** What a buyer in this aisle is usually solving for. */
  note: string;
};

export type Spec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  sku: string;
  category: CategorySlug;
  /** One line, written the way a maker would describe it to another maker. */
  summary: string;
  price: number;
  compareAt?: number;
  stock: number;
  specs: Spec[];
  tags: string[];
  featured?: boolean;
};

export const CATEGORIES: Category[] = [
  {
    slug: "dev-boards",
    name: "Dev boards & MCUs",
    blurb: "ESP32, Pico, Uno-compatible, STM32 and single-board computers.",
    note: "Start here if the project needs a brain.",
  },
  {
    slug: "components",
    name: "Components",
    blurb: "Passives, logic, transistors, connectors and the kits that save a trip.",
    note: "The drawer you refill, not the thing you shop for.",
  },
  {
    slug: "sensors",
    name: "Sensors & modules",
    blurb: "Temperature, motion, distance, RFID, displays and radios.",
    note: "How the project finds out what is going on.",
  },
  {
    slug: "test-measurement",
    name: "Test & measurement",
    blurb: "Multimeters, scopes, logic analysers and bench supplies.",
    note: "For when it should work and doesn't.",
  },
  {
    slug: "soldering",
    name: "Soldering & rework",
    blurb: "Stations, hot air, solder, flux, wick and desoldering gear.",
    note: "Joints that survive being moved.",
  },
  {
    slug: "power",
    name: "Power & batteries",
    blurb: "Cells, chargers, converters, panels and protection.",
    note: "Nigerian mains is not a given — plan for it.",
  },
  {
    slug: "prototyping",
    name: "Prototyping",
    blurb: "Breadboards, jumpers, perfboard, enclosures and filament.",
    note: "Getting from a diagram to something you can hold.",
  },
  {
    slug: "workbench",
    name: "Hand tools & workbench",
    blurb: "Precision drivers, cutters, tweezers, calipers and ESD kit.",
    note: "The tools you notice only when they are cheap.",
  },
];

export const PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- dev boards
  {
    slug: "esp32-wroom-32-dev-board",
    name: "ESP32-WROOM-32 development board",
    sku: "VC-DEV-0101",
    category: "dev-boards",
    summary: "Dual-core with Wi-Fi and Bluetooth on board — the default choice for anything connected.",
    price: 12500,
    stock: 64,
    featured: true,
    specs: [
      { label: "Core", value: "Dual-core Xtensa LX6, 240 MHz" },
      { label: "Wireless", value: "Wi-Fi 802.11 b/g/n, BT 4.2" },
      { label: "Flash", value: "4 MB" },
      { label: "GPIO", value: "30 pins, 18× ADC" },
    ],
    tags: ["wifi", "bluetooth", "arduino ide", "micropython"],
  },
  {
    slug: "raspberry-pi-pico-w",
    name: "Raspberry Pi Pico W",
    sku: "VC-DEV-0102",
    category: "dev-boards",
    summary: "RP2040 with Wi-Fi, and the best documentation of anything at this price.",
    price: 14200,
    stock: 48,
    featured: true,
    specs: [
      { label: "Core", value: "Dual-core Cortex-M0+, 133 MHz" },
      { label: "Wireless", value: "Wi-Fi 802.11n" },
      { label: "SRAM", value: "264 KB" },
      { label: "Flash", value: "2 MB" },
    ],
    tags: ["rp2040", "micropython", "c sdk"],
  },
  {
    slug: "uno-r3-compatible-board",
    name: "Uno R3 compatible board",
    sku: "VC-DEV-0103",
    category: "dev-boards",
    summary: "The board every tutorial assumes you have. Shield-compatible, 5 V tolerant.",
    price: 18900,
    stock: 37,
    specs: [
      { label: "MCU", value: "ATmega328P, 16 MHz" },
      { label: "Logic", value: "5 V" },
      { label: "I/O", value: "14 digital, 6 analog" },
      { label: "USB", value: "Type-B" },
    ],
    tags: ["atmega328p", "beginner", "shields"],
  },
  {
    slug: "stm32f103-blue-pill",
    name: "STM32F103 \"Blue Pill\" board",
    sku: "VC-DEV-0104",
    category: "dev-boards",
    summary: "Cheap 32-bit ARM when an 8-bit MCU has run out of room. Needs an ST-Link to flash.",
    price: 9800,
    stock: 52,
    specs: [
      { label: "MCU", value: "STM32F103C8T6, 72 MHz" },
      { label: "Flash", value: "64 KB" },
      { label: "Logic", value: "3.3 V, 5 V tolerant pins" },
      { label: "Programming", value: "SWD / USB DFU" },
    ],
    tags: ["arm", "cortex-m3", "stm32cube"],
  },
  {
    slug: "raspberry-pi-5-4gb",
    name: "Raspberry Pi 5, 4 GB",
    sku: "VC-DEV-0105",
    category: "dev-boards",
    summary: "A full Linux machine for vision, servers and anything that outgrew a microcontroller.",
    price: 148000,
    stock: 9,
    specs: [
      { label: "CPU", value: "Quad-core Cortex-A76, 2.4 GHz" },
      { label: "RAM", value: "4 GB LPDDR4X" },
      { label: "Video", value: "2× micro-HDMI, 4Kp60" },
      { label: "Power", value: "5 V / 5 A USB-C" },
    ],
    tags: ["linux", "sbc", "pcie"],
  },
  {
    slug: "esp32-cam-module",
    name: "ESP32-CAM module with OV2640",
    sku: "VC-DEV-0106",
    category: "dev-boards",
    summary: "Camera, Wi-Fi and an SD slot for the price of a decent lunch. Runs hot — give it airflow.",
    price: 16400,
    stock: 26,
    specs: [
      { label: "Sensor", value: "OV2640, 2 MP" },
      { label: "Storage", value: "microSD, up to 4 GB" },
      { label: "Wireless", value: "Wi-Fi + BT" },
      { label: "Programming", value: "External USB-TTL required" },
    ],
    tags: ["camera", "wifi", "streaming"],
  },

  // ---------------------------------------------------------------- components
  {
    slug: "resistor-kit-1280",
    name: "Resistor kit, 1,280 pieces",
    sku: "VC-CMP-0201",
    category: "components",
    summary: "64 values from 10 Ω to 1 MΩ, sorted and labelled. Ends the 'do we have a 4k7' argument.",
    price: 8700,
    stock: 71,
    featured: true,
    specs: [
      { label: "Values", value: "64 (10 Ω – 1 MΩ)" },
      { label: "Quantity", value: "20 per value" },
      { label: "Tolerance", value: "±1% metal film" },
      { label: "Rating", value: "1/4 W" },
    ],
    tags: ["passives", "kit", "e24"],
  },
  {
    slug: "ceramic-capacitor-kit",
    name: "Ceramic capacitor kit, 300 pieces",
    sku: "VC-CMP-0202",
    category: "components",
    summary: "30 values of decoupling caps in a labelled case. Buy it before you need it at 1am.",
    price: 7400,
    stock: 58,
    specs: [
      { label: "Values", value: "30 (10 pF – 100 nF)" },
      { label: "Quantity", value: "10 per value" },
      { label: "Voltage", value: "50 V" },
      { label: "Pitch", value: "2.54 mm" },
    ],
    tags: ["passives", "decoupling", "kit"],
  },
  {
    slug: "electrolytic-capacitor-kit",
    name: "Electrolytic capacitor kit, 120 pieces",
    sku: "VC-CMP-0203",
    category: "components",
    summary: "Bulk capacitance for supplies and audio. Radial, 105 °C rated so they last.",
    price: 9600,
    stock: 40,
    specs: [
      { label: "Values", value: "12 (0.1 µF – 1000 µF)" },
      { label: "Voltage", value: "16 – 50 V" },
      { label: "Temperature", value: "105 °C" },
      { label: "Type", value: "Radial, through-hole" },
    ],
    tags: ["passives", "power supply", "kit"],
  },
  {
    slug: "transistor-assortment",
    name: "Transistor & diode assortment, 200 pieces",
    sku: "VC-CMP-0204",
    category: "components",
    summary: "The usual suspects: 2N2222, BC547, IRF540N, 1N4007, 1N4148 and friends.",
    price: 11300,
    stock: 33,
    specs: [
      { label: "Bipolar", value: "2N2222, 2N3904, BC547, BC557" },
      { label: "MOSFET", value: "IRF540N, IRLZ44N" },
      { label: "Diodes", value: "1N4007, 1N4148, Schottky" },
      { label: "Packaging", value: "Labelled compartment case" },
    ],
    tags: ["semiconductors", "switching", "kit"],
  },
  {
    slug: "74hc595-shift-register-10",
    name: "74HC595 shift registers, pack of 10",
    sku: "VC-CMP-0205",
    category: "components",
    summary: "Three pins in, eight out. The cheapest way to stop running out of GPIO.",
    price: 5600,
    stock: 62,
    specs: [
      { label: "Function", value: "8-bit serial-in, parallel-out" },
      { label: "Supply", value: "2 – 6 V" },
      { label: "Package", value: "DIP-16" },
      { label: "Quantity", value: "10" },
    ],
    tags: ["logic", "gpio expansion", "dip"],
  },
  {
    slug: "dupont-connector-kit",
    name: "Dupont connector & crimp kit, 620 pieces",
    sku: "VC-CMP-0206",
    category: "components",
    summary: "Housings, pins and a crimp tool, so wiring stops being twisted strands and tape.",
    price: 15700,
    stock: 24,
    specs: [
      { label: "Pitch", value: "2.54 mm" },
      { label: "Housings", value: "1 – 6 way" },
      { label: "Includes", value: "SN-28B crimp tool" },
      { label: "Quantity", value: "620 pieces" },
    ],
    tags: ["connectors", "crimping", "wiring"],
  },

  // ------------------------------------------------------------------- sensors
  {
    slug: "dht22-temperature-humidity",
    name: "DHT22 temperature & humidity sensor",
    sku: "VC-SEN-0301",
    category: "sensors",
    summary: "Slower than a DHT11 but honest about it. Fine for rooms, greenhouses and dataloggers.",
    price: 7900,
    stock: 45,
    specs: [
      { label: "Temperature", value: "−40 to 80 °C, ±0.5 °C" },
      { label: "Humidity", value: "0 – 100% RH, ±2%" },
      { label: "Interface", value: "Single-wire digital" },
      { label: "Sample rate", value: "0.5 Hz" },
    ],
    tags: ["environment", "datalogging", "1-wire"],
  },
  {
    slug: "mpu6050-imu",
    name: "MPU-6050 6-axis IMU module",
    sku: "VC-SEN-0302",
    category: "sensors",
    summary: "Accelerometer and gyro on I²C. Balancing robots, gesture input, tilt detection.",
    price: 6400,
    stock: 57,
    featured: true,
    specs: [
      { label: "Axes", value: "3× accel, 3× gyro" },
      { label: "Accel range", value: "±2 / 4 / 8 / 16 g" },
      { label: "Gyro range", value: "±250 – 2000 °/s" },
      { label: "Interface", value: "I²C, up to 400 kHz" },
    ],
    tags: ["motion", "i2c", "robotics"],
  },
  {
    slug: "hc-sr04-ultrasonic-3pack",
    name: "HC-SR04 ultrasonic range finder, 3 pack",
    sku: "VC-SEN-0303",
    category: "sensors",
    summary: "Two to four hundred centimetres, cheap and repeatable. Struggles with soft surfaces.",
    price: 5700,
    stock: 68,
    specs: [
      { label: "Range", value: "2 – 400 cm" },
      { label: "Resolution", value: "3 mm" },
      { label: "Beam angle", value: "15°" },
      { label: "Supply", value: "5 V" },
    ],
    tags: ["distance", "robotics", "3 pack"],
  },
  {
    slug: "oled-096-i2c",
    name: "0.96\" OLED display, I²C",
    sku: "VC-SEN-0304",
    category: "sensors",
    summary: "128×64 white-on-black, readable in sunlight, four wires. The default project display.",
    price: 8300,
    stock: 51,
    specs: [
      { label: "Resolution", value: "128 × 64" },
      { label: "Driver", value: "SSD1306" },
      { label: "Interface", value: "I²C (0x3C)" },
      { label: "Supply", value: "3.3 – 5 V" },
    ],
    tags: ["display", "i2c", "ssd1306"],
  },
  {
    slug: "mfrc522-rfid-kit",
    name: "MFRC522 RFID reader kit",
    sku: "VC-SEN-0305",
    category: "sensors",
    summary: "13.56 MHz reader with a card and a fob. Access control, attendance, inventory.",
    price: 9100,
    stock: 29,
    specs: [
      { label: "Frequency", value: "13.56 MHz" },
      { label: "Interface", value: "SPI" },
      { label: "Read range", value: "Up to 60 mm" },
      { label: "Includes", value: "Card + keyfob tag" },
    ],
    tags: ["rfid", "spi", "access control"],
  },
  {
    slug: "ds18b20-waterproof-probe",
    name: "DS18B20 waterproof temperature probe",
    sku: "VC-SEN-0306",
    category: "sensors",
    summary: "Stainless probe on a 1 m lead. Several share one pin — good for multi-point logging.",
    price: 6900,
    stock: 44,
    specs: [
      { label: "Range", value: "−55 to 125 °C" },
      { label: "Accuracy", value: "±0.5 °C (−10 to 85 °C)" },
      { label: "Interface", value: "1-Wire, addressable" },
      { label: "Cable", value: "1 m, stainless probe" },
    ],
    tags: ["temperature", "1-wire", "waterproof"],
  },

  // -------------------------------------------------------- test & measurement
  {
    slug: "true-rms-digital-multimeter",
    name: "True-RMS digital multimeter",
    sku: "VC-TST-0401",
    category: "test-measurement",
    summary: "6,000 count, auto-ranging, with continuity that actually beeps fast enough to be useful.",
    price: 38500,
    compareAt: 44000,
    stock: 31,
    featured: true,
    specs: [
      { label: "Count", value: "6,000" },
      { label: "DC accuracy", value: "±0.5%" },
      { label: "Safety", value: "CAT III 600 V" },
      { label: "Measures", value: "V, A, Ω, Hz, C, temp, diode" },
    ],
    tags: ["multimeter", "true-rms", "cat iii"],
  },
  {
    slug: "usb-logic-analyser-8ch",
    name: "USB logic analyser, 8 channel",
    sku: "VC-TST-0402",
    category: "test-measurement",
    summary: "Works with sigrok and PulseView. Turns 'the I²C isn't working' into a five-minute job.",
    price: 26400,
    stock: 22,
    featured: true,
    specs: [
      { label: "Channels", value: "8" },
      { label: "Sample rate", value: "24 MHz" },
      { label: "Software", value: "sigrok / PulseView" },
      { label: "Logic", value: "3.3 V / 5 V" },
    ],
    tags: ["debugging", "i2c", "spi", "uart"],
  },
  {
    slug: "dso-100mhz-2ch",
    name: "Digital storage oscilloscope, 100 MHz 2-channel",
    sku: "VC-TST-0403",
    category: "test-measurement",
    summary: "Entry bench scope with real bandwidth. The jump from guessing to seeing.",
    price: 615000,
    stock: 4,
    specs: [
      { label: "Bandwidth", value: "100 MHz" },
      { label: "Channels", value: "2" },
      { label: "Sample rate", value: "1 GSa/s" },
      { label: "Memory depth", value: "24 Mpts" },
    ],
    tags: ["oscilloscope", "bench", "analog"],
  },
  {
    slug: "bench-power-supply-30v-5a",
    name: "Bench power supply, 0–30 V / 0–5 A",
    sku: "VC-TST-0404",
    category: "test-measurement",
    summary: "Adjustable with current limiting, which is what saves the board when you wire it backwards.",
    price: 138000,
    stock: 11,
    specs: [
      { label: "Voltage", value: "0 – 30 V" },
      { label: "Current", value: "0 – 5 A" },
      { label: "Mode", value: "CV / CC with limit" },
      { label: "Resolution", value: "10 mV / 1 mA" },
    ],
    tags: ["psu", "bench", "current limit"],
  },
  {
    slug: "usb-c-power-meter",
    name: "USB-C power meter & PD trigger",
    sku: "VC-TST-0405",
    category: "test-measurement",
    summary: "Inline voltage, current and capacity, plus PD negotiation. Settles cable and charger arguments.",
    price: 19800,
    stock: 27,
    specs: [
      { label: "Voltage", value: "4 – 30 V" },
      { label: "Current", value: "0 – 6.5 A" },
      { label: "Protocols", value: "PD 3.0, QC 2.0/3.0" },
      { label: "Display", value: "Colour IPS" },
    ],
    tags: ["usb-c", "pd", "charging"],
  },

  // ----------------------------------------------------------------- soldering
  {
    slug: "temperature-soldering-station",
    name: "Temperature-controlled soldering station, 60 W",
    sku: "VC-SLD-0501",
    category: "soldering",
    summary: "Holds its tip temperature under load, which a plug-in iron does not. Start here.",
    price: 42000,
    stock: 19,
    featured: true,
    specs: [
      { label: "Power", value: "60 W" },
      { label: "Range", value: "200 – 480 °C" },
      { label: "Tips", value: "900M series" },
      { label: "Includes", value: "Stand, sponge, 2 tips" },
    ],
    tags: ["soldering", "station", "esd safe"],
  },
  {
    slug: "hot-air-rework-station",
    name: "Hot air rework station, 700 W",
    sku: "VC-SLD-0502",
    category: "soldering",
    summary: "For surface mount, shrink tubing and lifting parts you regret soldering.",
    price: 96500,
    stock: 8,
    specs: [
      { label: "Power", value: "700 W" },
      { label: "Air temperature", value: "100 – 480 °C" },
      { label: "Airflow", value: "120 L/min" },
      { label: "Nozzles", value: "3 included" },
    ],
    tags: ["smd", "rework", "hot air"],
  },
  {
    slug: "solder-wire-0-8mm",
    name: "Rosin-core solder wire, 0.8 mm, 100 g",
    sku: "VC-SLD-0503",
    category: "soldering",
    summary: "63/37 eutectic — it sets instantly instead of going grainy if the joint moves.",
    price: 11200,
    stock: 76,
    specs: [
      { label: "Alloy", value: "Sn63/Pb37 eutectic" },
      { label: "Diameter", value: "0.8 mm" },
      { label: "Flux", value: "2.0% rosin core" },
      { label: "Weight", value: "100 g" },
    ],
    tags: ["solder", "leaded", "consumable"],
  },
  {
    slug: "no-clean-flux-paste",
    name: "No-clean flux paste, 10 g",
    sku: "VC-SLD-0504",
    category: "soldering",
    summary: "The difference between a joint that wets and one you keep reheating.",
    price: 4800,
    stock: 83,
    specs: [
      { label: "Type", value: "No-clean rosin" },
      { label: "Weight", value: "10 g" },
      { label: "Applicator", value: "Syringe with needle" },
      { label: "Use", value: "Through-hole and SMD" },
    ],
    tags: ["flux", "consumable", "smd"],
  },
  {
    slug: "desoldering-pump-and-wick",
    name: "Desoldering pump & braid set",
    sku: "VC-SLD-0505",
    category: "soldering",
    summary: "Aluminium pump plus 1.5 m of 2 mm braid. For undoing what the last session did.",
    price: 5900,
    stock: 54,
    specs: [
      { label: "Pump", value: "Aluminium body, ESD nozzle" },
      { label: "Braid", value: "2 mm × 1.5 m, rosin coated" },
      { label: "Use", value: "Through-hole rework" },
      { label: "Includes", value: "Spare nozzle" },
    ],
    tags: ["desoldering", "rework", "consumable"],
  },

  // --------------------------------------------------------------------- power
  {
    slug: "18650-cell-3400mah",
    name: "18650 Li-ion cell, 3400 mAh (protected)",
    sku: "VC-PWR-0601",
    category: "power",
    summary: "Protected cell with real capacity. Buy protected unless your board does the protecting.",
    price: 6800,
    stock: 92,
    specs: [
      { label: "Capacity", value: "3400 mAh" },
      { label: "Nominal", value: "3.7 V" },
      { label: "Protection", value: "Over-charge / discharge / short" },
      { label: "Discharge", value: "Up to 6.8 A" },
    ],
    tags: ["li-ion", "18650", "protected"],
  },
  {
    slug: "tp4056-charger-module-5pack",
    name: "TP4056 charging module with protection, 5 pack",
    sku: "VC-PWR-0602",
    category: "power",
    summary: "USB-C single-cell charging with DW01 protection. Get the version with the extra chip.",
    price: 4200,
    stock: 74,
    specs: [
      { label: "Input", value: "USB-C, 4.5 – 5.5 V" },
      { label: "Charge current", value: "1 A (settable)" },
      { label: "Protection", value: "DW01 + FS8205A" },
      { label: "Quantity", value: "5" },
    ],
    tags: ["charging", "li-ion", "usb-c"],
  },
  {
    slug: "lm2596-buck-converter-5pack",
    name: "LM2596 adjustable buck converter, 5 pack",
    sku: "VC-PWR-0603",
    category: "power",
    summary: "Step 12 V down to 5 V or 3.3 V without cooking a linear regulator.",
    price: 6300,
    stock: 61,
    specs: [
      { label: "Input", value: "4 – 35 V" },
      { label: "Output", value: "1.25 – 30 V adjustable" },
      { label: "Current", value: "2 A continuous, 3 A peak" },
      { label: "Efficiency", value: "Up to 92%" },
    ],
    tags: ["buck", "regulator", "5 pack"],
  },
  {
    slug: "12v-7ah-sla-battery",
    name: "12 V 7 Ah sealed lead-acid battery",
    sku: "VC-PWR-0604",
    category: "power",
    summary: "The workhorse for alarm panels, small inverters and bench backup when the grid drops.",
    price: 22500,
    stock: 18,
    specs: [
      { label: "Voltage", value: "12 V" },
      { label: "Capacity", value: "7 Ah" },
      { label: "Terminal", value: "F2 faston" },
      { label: "Type", value: "Sealed, maintenance-free" },
    ],
    tags: ["sla", "backup", "12v"],
  },
  {
    slug: "100w-solar-panel",
    name: "100 W monocrystalline solar panel",
    sku: "VC-PWR-0605",
    category: "power",
    summary: "Enough for a small off-grid bench or a remote logger. Pair it with an MPPT controller.",
    price: 78000,
    stock: 13,
    specs: [
      { label: "Rated power", value: "100 W" },
      { label: "Vmp / Imp", value: "18.0 V / 5.56 A" },
      { label: "Cell type", value: "Monocrystalline" },
      { label: "Frame", value: "Anodised aluminium, IP65 box" },
    ],
    tags: ["solar", "off-grid", "monocrystalline"],
  },

  // --------------------------------------------------------------- prototyping
  {
    slug: "breadboard-830-point",
    name: "Solderless breadboard, 830 tie points",
    sku: "VC-PRO-0701",
    category: "prototyping",
    summary: "Full-size with power rails on both sides. Contacts that still grip after a hundred insertions.",
    price: 3200,
    stock: 88,
    specs: [
      { label: "Tie points", value: "830" },
      { label: "Rails", value: "2 distribution strips" },
      { label: "Pitch", value: "2.54 mm" },
      { label: "Backing", value: "Self-adhesive" },
    ],
    tags: ["breadboard", "solderless", "prototyping"],
  },
  {
    slug: "jumper-wire-set-120",
    name: "Jumper wire set, 120 pieces",
    sku: "VC-PRO-0702",
    category: "prototyping",
    summary: "Male-male, male-female and female-female in three lengths. You will lose half of them.",
    price: 4500,
    stock: 96,
    featured: true,
    specs: [
      { label: "Quantity", value: "120 (40 of each type)" },
      { label: "Lengths", value: "10 / 20 / 30 cm" },
      { label: "Conductor", value: "26 AWG stranded" },
      { label: "Pitch", value: "2.54 mm Dupont" },
    ],
    tags: ["jumpers", "dupont", "breadboard"],
  },
  {
    slug: "perfboard-5-pack",
    name: "Double-sided perfboard, 5 pack",
    sku: "VC-PRO-0703",
    category: "prototyping",
    summary: "Plated through-holes so joints hold on both sides. For when the breadboard version works.",
    price: 6100,
    stock: 47,
    specs: [
      { label: "Sizes", value: "2× 5×7, 2× 7×9, 1× 9×15 cm" },
      { label: "Pitch", value: "2.54 mm" },
      { label: "Plating", value: "Double-sided, HASL" },
      { label: "Substrate", value: "FR-4" },
    ],
    tags: ["perfboard", "fr-4", "5 pack"],
  },
  {
    slug: "abs-project-enclosure",
    name: "ABS project enclosure, 158 × 90 × 60 mm",
    sku: "VC-PRO-0704",
    category: "prototyping",
    summary: "Screw-down lid with PCB standoffs, so the finished thing stops looking like a prototype.",
    price: 4900,
    stock: 39,
    specs: [
      { label: "External", value: "158 × 90 × 60 mm" },
      { label: "Material", value: "ABS, flame retardant" },
      { label: "Mounting", value: "Internal PCB standoffs" },
      { label: "Rating", value: "IP54 with gasket" },
    ],
    tags: ["enclosure", "abs", "housing"],
  },
  {
    slug: "pla-filament-1kg",
    name: "PLA filament, 1.75 mm, 1 kg",
    sku: "VC-PRO-0705",
    category: "prototyping",
    summary: "Vacuum-sealed with desiccant — it matters in Lagos humidity. Prints at 200 °C.",
    price: 19500,
    stock: 34,
    specs: [
      { label: "Diameter", value: "1.75 mm ±0.02 mm" },
      { label: "Weight", value: "1 kg spool" },
      { label: "Nozzle temp", value: "195 – 215 °C" },
      { label: "Packaging", value: "Vacuum sealed with desiccant" },
    ],
    tags: ["3d printing", "pla", "filament"],
  },

  // ------------------------------------------------------------------ workbench
  {
    slug: "precision-screwdriver-set-25",
    name: "Precision screwdriver set, 25-in-1",
    sku: "VC-WRK-0801",
    category: "workbench",
    summary: "CRV bits including the security drivers, in a case that keeps them in order.",
    price: 16800,
    stock: 42,
    featured: true,
    specs: [
      { label: "Bits", value: "25, S2 steel" },
      { label: "Types", value: "Phillips, Torx, Pentalobe, Tri-point" },
      { label: "Handle", value: "Magnetic, rotating cap" },
      { label: "Case", value: "Indexed, hard shell" },
    ],
    tags: ["screwdriver", "repair", "precision"],
  },
  {
    slug: "esd-tweezers-set",
    name: "ESD tweezers set, 6 piece",
    sku: "VC-WRK-0802",
    category: "workbench",
    summary: "Anti-static, non-magnetic, with tips fine enough for 0603 parts.",
    price: 7500,
    stock: 55,
    specs: [
      { label: "Pieces", value: "6 (straight, curved, flat, fine)" },
      { label: "Material", value: "Stainless, anti-magnetic" },
      { label: "Coating", value: "ESD safe" },
      { label: "Finest tip", value: "0.1 mm" },
    ],
    tags: ["tweezers", "esd", "smd"],
  },
  {
    slug: "flush-cutters",
    name: "Flush cutters, 130 mm",
    sku: "VC-WRK-0803",
    category: "workbench",
    summary: "Trims leads level with the board. Do not use them on steel — that is how they die.",
    price: 9400,
    stock: 48,
    specs: [
      { label: "Length", value: "130 mm" },
      { label: "Cut", value: "Flush, up to 1.3 mm copper" },
      { label: "Blade", value: "Carbon steel, induction hardened" },
      { label: "Grip", value: "ESD-safe, spring return" },
    ],
    tags: ["cutters", "esd", "leads"],
  },
  {
    slug: "digital-calipers-150mm",
    name: "Digital calipers, 150 mm",
    sku: "VC-WRK-0804",
    category: "workbench",
    summary: "Stainless with 0.01 mm resolution — for enclosures, shafts and CAD that has to fit.",
    price: 21000,
    stock: 30,
    specs: [
      { label: "Range", value: "0 – 150 mm" },
      { label: "Resolution", value: "0.01 mm" },
      { label: "Accuracy", value: "±0.02 mm" },
      { label: "Modes", value: "mm / inch / fraction, zero anywhere" },
    ],
    tags: ["measuring", "calipers", "cad"],
  },
  {
    slug: "esd-mat-and-wrist-strap",
    name: "ESD bench mat & wrist strap kit",
    sku: "VC-WRK-0805",
    category: "workbench",
    summary: "Static kills parts slowly, so you blame the code. Ground the bench and stop guessing.",
    price: 24600,
    stock: 21,
    specs: [
      { label: "Mat", value: "600 × 400 mm, two-layer rubber" },
      { label: "Resistance", value: "10⁶ – 10⁹ Ω surface" },
      { label: "Includes", value: "Wrist strap, ground cord, stud" },
      { label: "Cord", value: "1 MΩ current-limited" },
    ],
    tags: ["esd", "bench", "safety"],
  },
  {
    slug: "helping-hands-with-magnifier",
    name: "Helping hands with LED magnifier",
    sku: "VC-WRK-0806",
    category: "workbench",
    summary: "Weighted base, flexible arms and light where the joint is. Third hand you actually own.",
    price: 18200,
    stock: 26,
    specs: [
      { label: "Arms", value: "2 flexible, silicone-tipped clips" },
      { label: "Magnifier", value: "3× glass lens" },
      { label: "Light", value: "LED, USB powered" },
      { label: "Base", value: "Weighted cast iron" },
    ],
    tags: ["helping hands", "magnifier", "soldering"],
  },
];

// ------------------------------------------------------------------- accessors
// Everything in the app reads the catalogue through these, so swapping the data
// source later means changing this file and nothing else.

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return PRODUCTS.filter((p) => p.category === slug);
}

export function getFeaturedProducts(limit = 6): Product[] {
  return PRODUCTS.filter((p) => p.featured).slice(0, limit);
}

export function countByCategory(slug: CategorySlug): number {
  return PRODUCTS.reduce((n, p) => (p.category === slug ? n + 1 : n), 0);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return PRODUCTS.filter((p) => {
    const haystack = [p.name, p.sku, p.summary, p.category, ...p.tags]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  ).slice(0, limit);
}

/** Low stock is a real signal for makers — it decides whether they order today. */
export function stockLabel(stock: number): { text: string; tone: "in" | "low" | "out" } {
  if (stock <= 0) return { text: "Out of stock", tone: "out" };
  if (stock <= 10) return { text: `Only ${stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
}
