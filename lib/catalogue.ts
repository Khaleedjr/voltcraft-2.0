/**
 * VoltCraft catalogue.
 *
 * STRUCTURE IS REAL, PRODUCT ROWS ARE NOT.
 *
 * The nine categories below, and the item count against each, were recovered
 * from the search index of the live voltcraft.org.ng WooCommerce store (this
 * environment's network policy blocks the site itself). The counts sum to 65,
 * which matches the store's own "ALL ITEMS (65)" figure, so the taxonomy and
 * the totals can be trusted.
 *
 * The individual products are NOT the store's real rows. They are standard
 * components of the kind each category holds, priced inside the store's real
 * ₦1,000–₦18,000 band, so the site reads correctly until the real catalogue
 * lands. Replace them with a WooCommerce CSV export; every consumer goes
 * through the accessors at the bottom of this file, so nothing else changes.
 */

export type CategorySlug =
  | "sensors"
  | "microcontrollers"
  | "display"
  | "actuators"
  | "connectors"
  | "accessories"
  | "switches"
  | "power"
  | "fluid-control";

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
    slug: "sensors",
    name: "Sensors",
    blurb: "Temperature, motion, distance, gas, current, light and touch.",
    note: "How the project finds out what is going on.",
  },
  {
    slug: "microcontrollers",
    name: "Microcontrollers",
    blurb: "Uno, Nano, Mega, ESP32, ESP8266, STM32 and Pico boards.",
    note: "Start here if the project needs a brain.",
  },
  {
    slug: "display",
    name: "Display",
    blurb: "Character LCDs, OLEDs, seven-segment and LED matrix modules.",
    note: "So the thing can tell you what it is doing.",
  },
  {
    slug: "actuators",
    name: "Actuators",
    blurb: "Servos, steppers, gear motors, relays and solenoids.",
    note: "The part that actually moves.",
  },
  {
    slug: "connectors",
    name: "Connectors",
    blurb: "Jumper wires, battery leads, Dupont, JST and terminal blocks.",
    note: "The half of the build that always runs out first.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    blurb: "Breadboards, perfboard, cables and the small consumables.",
    note: "Getting from a diagram to something you can hold.",
  },
  {
    slug: "switches",
    name: "Switches",
    blurb: "Tactile buttons, toggles, rockers and limit switches.",
    note: "Input that survives being pressed a thousand times.",
  },
  {
    slug: "power",
    name: "Power",
    blurb: "Converters, lithium charging modules and adapters.",
    note: "Nigerian mains is not a given — plan for it.",
  },
  {
    slug: "fluid-control",
    name: "Fluid control",
    blurb: "Pumps and solenoid valves for water and irrigation builds.",
    note: "For anything that has to move liquid.",
  },
];

export const PRODUCTS: Product[] = [
  // ------------------------------------------------------------- sensors (23)
  { slug: "dht11-temperature-humidity-sensor", name: "DHT11 temperature & humidity sensor", sku: "VC-SEN-001", category: "sensors",
    summary: "The cheapest way to log a room. Coarse, slow, and completely adequate for a first build.",
    price: 1800, stock: 62, tags: ["temperature", "humidity", "digital"],
    specs: [{ label: "Temperature", value: "0 – 50 °C, ±2 °C" }, { label: "Humidity", value: "20 – 90% RH, ±5%" }, { label: "Interface", value: "Single-wire digital" }] },
  { slug: "dht22-temperature-humidity-sensor", name: "DHT22 temperature & humidity sensor", sku: "VC-SEN-002", category: "sensors",
    summary: "Slower than a DHT11 but honest about it. Worth the extra for anything you plan to trust.",
    price: 4500, compareAt: 5200, stock: 44, featured: true, tags: ["temperature", "humidity", "datalogging"],
    specs: [{ label: "Temperature", value: "−40 – 80 °C, ±0.5 °C" }, { label: "Humidity", value: "0 – 100% RH, ±2%" }, { label: "Sample rate", value: "0.5 Hz" }] },
  { slug: "ds18b20-waterproof-probe", name: "DS18B20 waterproof temperature probe", sku: "VC-SEN-003", category: "sensors",
    summary: "Stainless probe on a 1 m lead. Several share one pin, so multi-point logging costs almost nothing.",
    price: 3200, stock: 38, tags: ["temperature", "1-wire", "waterproof"],
    specs: [{ label: "Range", value: "−55 – 125 °C" }, { label: "Accuracy", value: "±0.5 °C" }, { label: "Interface", value: "1-Wire, addressable" }] },
  { slug: "hc-sr04-ultrasonic-sensor", name: "HC-SR04 ultrasonic distance sensor", sku: "VC-SEN-004", category: "sensors",
    summary: "Two to four hundred centimetres, cheap and repeatable. Struggles with soft or angled surfaces.",
    price: 1500, stock: 85, featured: true, tags: ["distance", "robotics", "ultrasonic"],
    specs: [{ label: "Range", value: "2 – 400 cm" }, { label: "Resolution", value: "3 mm" }, { label: "Supply", value: "5 V" }] },
  { slug: "ir-obstacle-avoidance-sensor", name: "IR obstacle avoidance sensor", sku: "VC-SEN-005", category: "sensors",
    summary: "Adjustable trip distance on a pot. The standard bumper for a line-following robot.",
    price: 1200, stock: 71, tags: ["infrared", "robotics", "proximity"],
    specs: [{ label: "Range", value: "2 – 30 cm, adjustable" }, { label: "Output", value: "Digital, active low" }, { label: "Supply", value: "3.3 – 5 V" }] },
  { slug: "pir-motion-sensor", name: "PIR motion sensor (HC-SR501)", sku: "VC-SEN-006", category: "sensors",
    summary: "Detects a body moving, not a body standing still. Trim delay and sensitivity on board.",
    price: 2400, stock: 53, tags: ["motion", "security", "pir"],
    specs: [{ label: "Range", value: "Up to 7 m" }, { label: "Angle", value: "110°" }, { label: "Delay", value: "5 s – 5 min, adjustable" }] },
  { slug: "ldr-light-sensor-module", name: "LDR light sensor module", sku: "VC-SEN-007", category: "sensors",
    summary: "Analogue and digital output on one board. Street-light logic in about four lines of code.",
    price: 1000, stock: 94, tags: ["light", "analogue", "ldr"],
    specs: [{ label: "Output", value: "Analogue + digital threshold" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Adjustment", value: "On-board potentiometer" }] },
  { slug: "mq2-gas-smoke-sensor", name: "MQ-2 gas & smoke sensor", sku: "VC-SEN-008", category: "sensors",
    summary: "LPG, methane and smoke. Needs a burn-in before the readings settle — give it 24 hours.",
    price: 3000, stock: 41, tags: ["gas", "smoke", "safety"],
    specs: [{ label: "Detects", value: "LPG, propane, methane, smoke" }, { label: "Range", value: "300 – 10,000 ppm" }, { label: "Output", value: "Analogue + digital" }] },
  { slug: "mq7-carbon-monoxide-sensor", name: "MQ-7 carbon monoxide sensor", sku: "VC-SEN-009", category: "sensors",
    summary: "CO detection for generator sheds and enclosed spaces. Cycles its heater between readings.",
    price: 3400, stock: 29, tags: ["gas", "carbon monoxide", "safety"],
    specs: [{ label: "Detects", value: "Carbon monoxide" }, { label: "Range", value: "20 – 2,000 ppm" }, { label: "Output", value: "Analogue + digital" }] },
  { slug: "soil-moisture-sensor", name: "Soil moisture sensor", sku: "VC-SEN-010", category: "sensors",
    summary: "The irrigation project starts here. Pair it with a pump and a relay and walk away.",
    price: 1600, stock: 66, tags: ["soil", "irrigation", "analogue"],
    specs: [{ label: "Output", value: "Analogue + digital threshold" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Probe", value: "Two-prong, corrosion prone" }] },
  { slug: "rain-water-level-sensor", name: "Rain & water level sensor", sku: "VC-SEN-011", category: "sensors",
    summary: "Detects rain on the board or depth in a tank, depending on how you mount it.",
    price: 1500, stock: 58, tags: ["water", "rain", "level"],
    specs: [{ label: "Output", value: "Analogue + digital" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Sensing area", value: "54 × 40 mm" }] },
  { slug: "mpu6050-accelerometer-gyroscope", name: "MPU-6050 accelerometer & gyroscope", sku: "VC-SEN-012", category: "sensors",
    summary: "Six axes on I²C. Balancing robots, gesture input, tilt detection, drone experiments.",
    price: 3800, stock: 47, featured: true, tags: ["motion", "imu", "i2c"],
    specs: [{ label: "Axes", value: "3× accel, 3× gyro" }, { label: "Accel range", value: "±2 / 4 / 8 / 16 g" }, { label: "Interface", value: "I²C, up to 400 kHz" }] },
  { slug: "hall-effect-magnetic-sensor", name: "Hall effect magnetic sensor", sku: "VC-SEN-013", category: "sensors",
    summary: "Counts magnets going past. The usual way to measure wheel or fan speed.",
    price: 1300, stock: 72, tags: ["magnetic", "rpm", "hall"],
    specs: [{ label: "Output", value: "Digital, active low" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Use", value: "Speed and position sensing" }] },
  { slug: "sound-detection-sensor", name: "Sound detection sensor", sku: "VC-SEN-014", category: "sensors",
    summary: "Trips on a clap or a knock. A threshold detector, not a microphone — it will not record.",
    price: 1400, stock: 61, tags: ["sound", "microphone", "threshold"],
    specs: [{ label: "Output", value: "Analogue + digital threshold" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Adjustment", value: "On-board potentiometer" }] },
  { slug: "flame-sensor-module", name: "Flame sensor module", sku: "VC-SEN-015", category: "sensors",
    summary: "Infrared flame detection at short range. Fire-alarm projects and burner monitoring.",
    price: 1500, stock: 49, tags: ["flame", "infrared", "safety"],
    specs: [{ label: "Wavelength", value: "760 – 1100 nm" }, { label: "Range", value: "Up to 100 cm" }, { label: "Output", value: "Analogue + digital" }] },
  { slug: "voltage-sensor-module", name: "Voltage sensor module, 0–25 V", sku: "VC-SEN-016", category: "sensors",
    summary: "A calibrated divider so a 5 V board can read a 24 V rail without releasing smoke.",
    price: 1700, stock: 55, tags: ["voltage", "measurement", "divider"],
    specs: [{ label: "Input range", value: "0 – 25 V DC" }, { label: "Ratio", value: "5:1" }, { label: "Resolution", value: "0.00489 V" }] },
  { slug: "acs712-current-sensor", name: "ACS712 current sensor, 20 A", sku: "VC-SEN-017", category: "sensors",
    summary: "Hall-effect current sensing with the load side isolated from your microcontroller.",
    price: 4200, stock: 33, tags: ["current", "hall", "measurement"],
    specs: [{ label: "Range", value: "±20 A" }, { label: "Sensitivity", value: "100 mV/A" }, { label: "Isolation", value: "2.1 kV RMS" }] },
  { slug: "load-cell-hx711", name: "Load cell with HX711 amplifier", sku: "VC-SEN-018", category: "sensors",
    summary: "Build a scale. The HX711 does the 24-bit conversion; you supply the calibration weight.",
    price: 5500, stock: 26, tags: ["weight", "load cell", "hx711"],
    specs: [{ label: "Capacity", value: "5 kg" }, { label: "Amplifier", value: "HX711, 24-bit ADC" }, { label: "Output", value: "Two-wire serial" }] },
  { slug: "bmp280-pressure-sensor", name: "BMP280 barometric pressure sensor", sku: "VC-SEN-019", category: "sensors",
    summary: "Pressure and temperature on I²C, accurate enough to resolve a single flight of stairs.",
    price: 4000, stock: 37, tags: ["pressure", "altitude", "i2c"],
    specs: [{ label: "Pressure", value: "300 – 1100 hPa" }, { label: "Altitude resolution", value: "±1 m" }, { label: "Interface", value: "I²C / SPI" }] },
  { slug: "tcs3200-colour-sensor", name: "TCS3200 colour recognition sensor", sku: "VC-SEN-020", category: "sensors",
    summary: "Reads RGB off a surface under its own white LEDs. Sorting machines and line following.",
    price: 6500, stock: 18, tags: ["colour", "rgb", "sorting"],
    specs: [{ label: "Output", value: "Frequency proportional to intensity" }, { label: "Filters", value: "Red, green, blue, clear" }, { label: "Illumination", value: "4× white LED" }] },
  { slug: "pulse-heart-rate-sensor", name: "Pulse & heart rate sensor", sku: "VC-SEN-021", category: "sensors",
    summary: "Optical pulse sensing off a fingertip. A teaching tool, not a medical instrument.",
    price: 3600, stock: 31, tags: ["pulse", "optical", "wearable"],
    specs: [{ label: "Output", value: "Analogue" }, { label: "Supply", value: "3.3 – 5 V" }, { label: "Note", value: "Not for diagnostic use" }] },
  { slug: "reed-switch-magnetic-sensor", name: "Reed switch magnetic sensor", sku: "VC-SEN-022", category: "sensors",
    summary: "Door and window contacts. No power draw until the magnet moves away.",
    price: 1100, stock: 78, tags: ["reed", "door", "security"],
    specs: [{ label: "Type", value: "Normally open" }, { label: "Actuation", value: "10 – 15 mm" }, { label: "Rating", value: "100 V, 0.5 A" }] },
  { slug: "ir-line-tracking-sensor", name: "IR line tracking sensor", sku: "VC-SEN-023", category: "sensors",
    summary: "Reflectance sensing for line-following robots. Works best on matt black over white.",
    price: 1400, stock: 69, tags: ["line following", "infrared", "robotics"],
    specs: [{ label: "Range", value: "1 – 25 mm" }, { label: "Output", value: "Digital" }, { label: "Supply", value: "3.3 – 5 V" }] },

  // ----------------------------------------------------- microcontrollers (7)
  { slug: "uno-r3-compatible-board", name: "Uno R3 compatible board", sku: "VC-MCU-001", category: "microcontrollers",
    summary: "The board every tutorial assumes you have. Shield-compatible and 5 V tolerant.",
    price: 12500, stock: 34, featured: true, tags: ["atmega328p", "beginner", "shields"],
    specs: [{ label: "MCU", value: "ATmega328P, 16 MHz" }, { label: "Logic", value: "5 V" }, { label: "I/O", value: "14 digital, 6 analogue" }] },
  { slug: "nano-compatible-board", name: "Nano compatible board", sku: "VC-MCU-002", category: "microcontrollers",
    summary: "Same chip as the Uno in a breadboard footprint. What the project uses once it works.",
    price: 8500, stock: 46, tags: ["atmega328p", "breadboard", "compact"],
    specs: [{ label: "MCU", value: "ATmega328P, 16 MHz" }, { label: "Footprint", value: "Breadboard, DIP-30" }, { label: "USB", value: "Mini-B / CH340" }] },
  { slug: "esp32-wroom-development-board", name: "ESP32-WROOM development board", sku: "VC-MCU-003", category: "microcontrollers",
    summary: "Dual-core with Wi-Fi and Bluetooth on board — the default choice for anything connected.",
    price: 11000, stock: 52, featured: true, tags: ["wifi", "bluetooth", "esp32"],
    specs: [{ label: "Core", value: "Dual-core, 240 MHz" }, { label: "Wireless", value: "Wi-Fi b/g/n, BT 4.2" }, { label: "GPIO", value: "30 pins, 18× ADC" }] },
  { slug: "esp8266-nodemcu-board", name: "ESP8266 NodeMCU board", sku: "VC-MCU-004", category: "microcontrollers",
    summary: "Wi-Fi for the price of a sensor. Single core, fewer pins, still the cheapest way online.",
    price: 9000, stock: 43, tags: ["wifi", "esp8266", "iot"],
    specs: [{ label: "MCU", value: "ESP8266, 80 MHz" }, { label: "Wireless", value: "Wi-Fi 802.11 b/g/n" }, { label: "Flash", value: "4 MB" }] },
  { slug: "mega-2560-compatible-board", name: "Mega 2560 compatible board", sku: "VC-MCU-005", category: "microcontrollers",
    summary: "Fifty-four I/O pins for when the pin count, not the clock speed, is what ran out.",
    price: 18000, stock: 17, tags: ["atmega2560", "gpio", "large project"],
    specs: [{ label: "MCU", value: "ATmega2560, 16 MHz" }, { label: "I/O", value: "54 digital, 16 analogue" }, { label: "Flash", value: "256 KB" }] },
  { slug: "stm32f103-development-board", name: "STM32F103 development board", sku: "VC-MCU-006", category: "microcontrollers",
    summary: "Cheap 32-bit ARM when an 8-bit chip has run out of room. Needs an ST-Link to flash.",
    price: 7500, stock: 39, tags: ["arm", "cortex-m3", "stm32"],
    specs: [{ label: "MCU", value: "STM32F103C8T6, 72 MHz" }, { label: "Flash", value: "64 KB" }, { label: "Programming", value: "SWD / USB DFU" }] },
  { slug: "raspberry-pi-pico", name: "Raspberry Pi Pico", sku: "VC-MCU-007", category: "microcontrollers",
    summary: "RP2040 with the best documentation of anything at this price. MicroPython or C.",
    price: 9500, stock: 41, tags: ["rp2040", "micropython", "pico"],
    specs: [{ label: "Core", value: "Dual-core Cortex-M0+, 133 MHz" }, { label: "SRAM", value: "264 KB" }, { label: "Flash", value: "2 MB" }] },

  // -------------------------------------------------------------- display (8)
  { slug: "lcd-16x2-display", name: "16×2 character LCD display", sku: "VC-DSP-001", category: "display",
    summary: "Two lines of sixteen characters. Readable in daylight and impossible to kill.",
    price: 4500, stock: 48, featured: true, tags: ["lcd", "character", "hd44780"],
    specs: [{ label: "Format", value: "16 × 2 characters" }, { label: "Driver", value: "HD44780" }, { label: "Backlight", value: "LED" }] },
  { slug: "lcd-20x4-display", name: "20×4 character LCD display", sku: "VC-DSP-002", category: "display",
    summary: "Four lines when two are not enough for the menu you have designed.",
    price: 7800, stock: 24, tags: ["lcd", "character", "hd44780"],
    specs: [{ label: "Format", value: "20 × 4 characters" }, { label: "Driver", value: "HD44780" }, { label: "Supply", value: "5 V" }] },
  { slug: "i2c-lcd-backpack", name: "I²C LCD backpack module", sku: "VC-DSP-003", category: "display",
    summary: "Solders to the back of a character LCD and takes it from sixteen wires down to four.",
    price: 1800, stock: 67, tags: ["i2c", "lcd", "pcf8574"],
    specs: [{ label: "Chip", value: "PCF8574" }, { label: "Address", value: "0x27 / 0x3F" }, { label: "Fits", value: "16×2 and 20×4 LCDs" }] },
  { slug: "oled-096-i2c-display", name: "0.96\" OLED display, I²C", sku: "VC-DSP-004", category: "display",
    summary: "128×64 white on black, readable at an angle, four wires. The default project display.",
    price: 5200, stock: 44, featured: true, tags: ["oled", "i2c", "ssd1306"],
    specs: [{ label: "Resolution", value: "128 × 64" }, { label: "Driver", value: "SSD1306" }, { label: "Supply", value: "3.3 – 5 V" }] },
  { slug: "oled-13-spi-display", name: "1.3\" OLED display, SPI", sku: "VC-DSP-005", category: "display",
    summary: "The bigger sibling on a faster bus, for when the 0.96\" is too small to read across a room.",
    price: 7000, stock: 21, tags: ["oled", "spi", "sh1106"],
    specs: [{ label: "Resolution", value: "128 × 64" }, { label: "Driver", value: "SH1106" }, { label: "Interface", value: "SPI" }] },
  { slug: "seven-segment-display-module", name: "4-digit 7-segment display module", sku: "VC-DSP-006", category: "display",
    summary: "Clocks, counters and anything read from across a workshop. Two pins with TM1637.",
    price: 2600, stock: 51, tags: ["seven segment", "tm1637", "clock"],
    specs: [{ label: "Digits", value: "4, with colon" }, { label: "Driver", value: "TM1637" }, { label: "Interface", value: "Two-wire" }] },
  { slug: "led-matrix-max7219", name: "8×8 LED matrix module (MAX7219)", sku: "VC-DSP-007", category: "display",
    summary: "Chainable dot matrix for scrolling text. Four in a row makes a respectable ticker.",
    price: 3900, stock: 36, tags: ["led matrix", "max7219", "scrolling"],
    specs: [{ label: "Format", value: "8 × 8 per module" }, { label: "Driver", value: "MAX7219" }, { label: "Interface", value: "SPI, chainable" }] },
  { slug: "tft-colour-display-18", name: "1.8\" TFT colour display", sku: "VC-DSP-008", category: "display",
    summary: "Full colour at 128×160 with an SD slot on the back. Graphs, icons, small interfaces.",
    price: 8900, stock: 19, tags: ["tft", "colour", "st7735"],
    specs: [{ label: "Resolution", value: "128 × 160" }, { label: "Driver", value: "ST7735" }, { label: "Extra", value: "microSD socket" }] },

  // ------------------------------------------------------------ actuators (7)
  { slug: "sg90-micro-servo", name: "SG90 micro servo motor", sku: "VC-ACT-001", category: "actuators",
    summary: "Nine grams, 180 degrees, and in almost every first robot ever built.",
    price: 2800, stock: 74, featured: true, tags: ["servo", "robotics", "pwm"],
    specs: [{ label: "Torque", value: "1.8 kg·cm at 4.8 V" }, { label: "Rotation", value: "180°" }, { label: "Control", value: "PWM, 50 Hz" }] },
  { slug: "mg996r-servo-motor", name: "MG996R high-torque servo motor", sku: "VC-ACT-002", category: "actuators",
    summary: "Metal gears and real torque. Give it its own supply — it will brown out a board.",
    price: 8500, stock: 27, tags: ["servo", "metal gear", "high torque"],
    specs: [{ label: "Torque", value: "11 kg·cm at 6 V" }, { label: "Gears", value: "Metal" }, { label: "Stall current", value: "2.5 A" }] },
  { slug: "nema17-stepper-motor", name: "NEMA 17 stepper motor", sku: "VC-ACT-003", category: "actuators",
    summary: "The 3D printer and CNC standard. Precise positioning, needs a driver of its own.",
    price: 14500, stock: 15, tags: ["stepper", "cnc", "3d printing"],
    specs: [{ label: "Step angle", value: "1.8° (200 steps/rev)" }, { label: "Holding torque", value: "4.2 kg·cm" }, { label: "Current", value: "1.5 A per phase" }] },
  { slug: "28byj48-stepper-with-driver", name: "28BYJ-48 stepper with ULN2003 driver", sku: "VC-ACT-004", category: "actuators",
    summary: "Geared, slow and cheap, with the driver board in the box. The stepper you learn on.",
    price: 4200, stock: 48, tags: ["stepper", "uln2003", "geared"],
    specs: [{ label: "Supply", value: "5 V" }, { label: "Gear ratio", value: "1:64" }, { label: "Includes", value: "ULN2003 driver board" }] },
  { slug: "dc-gear-motor-with-wheel", name: "DC gear motor with wheel", sku: "VC-ACT-005", category: "actuators",
    summary: "Yellow gearbox motor and matching wheel — the drivetrain of every two-wheeled robot.",
    price: 3500, stock: 56, tags: ["dc motor", "gearbox", "robotics"],
    specs: [{ label: "Supply", value: "3 – 6 V" }, { label: "Gear ratio", value: "1:48" }, { label: "Speed", value: "200 rpm at 6 V" }] },
  { slug: "relay-module-1-channel", name: "5 V single-channel relay module", sku: "VC-ACT-006", category: "actuators",
    summary: "Switches mains-rated loads from a logic pin, with the opto-isolation already done.",
    price: 2000, stock: 63, tags: ["relay", "switching", "opto-isolated"],
    specs: [{ label: "Contact rating", value: "10 A at 250 V AC" }, { label: "Coil", value: "5 V" }, { label: "Isolation", value: "Optocoupler" }] },
  { slug: "solenoid-lock-12v", name: "Solenoid lock actuator, 12 V", sku: "VC-ACT-007", category: "actuators",
    summary: "Electric strike for access-control builds. Momentary duty only — it is not rated to hold.",
    price: 9500, stock: 22, tags: ["solenoid", "lock", "access control"],
    specs: [{ label: "Supply", value: "12 V DC" }, { label: "Current", value: "0.6 A" }, { label: "Duty", value: "Momentary, under 10 s" }] },

  // ----------------------------------------------------------- connectors (6)
  { slug: "battery-connectors", name: "Battery connectors", sku: "VC-CON-001", category: "connectors",
    summary: "Leads and clips for the usual cells and packs, so power stops being twisted strands.",
    price: 1000, stock: 96, tags: ["battery", "leads", "power"],
    specs: [{ label: "Types", value: "9 V snap, AA holder, JST" }, { label: "Conductor", value: "22 AWG stranded" }, { label: "Length", value: "150 mm" }] },
  { slug: "jumper-wires-male-male", name: "Jumper wires, male to male", sku: "VC-CON-002", category: "connectors",
    summary: "Forty ribbon-separable leads. You will lose half of them, which is why they come in forties.",
    price: 2500, stock: 88, featured: true, tags: ["jumper", "dupont", "breadboard"],
    specs: [{ label: "Quantity", value: "40" }, { label: "Length", value: "20 cm" }, { label: "Pitch", value: "2.54 mm" }] },
  { slug: "jumper-wires-male-female", name: "Jumper wires, male to female", sku: "VC-CON-003", category: "connectors",
    summary: "For getting from a breadboard to a module's header without soldering anything.",
    price: 2500, stock: 82, tags: ["jumper", "dupont", "modules"],
    specs: [{ label: "Quantity", value: "40" }, { label: "Length", value: "20 cm" }, { label: "Pitch", value: "2.54 mm" }] },
  { slug: "dupont-connector-crimp-kit", name: "Dupont connector & crimp kit", sku: "VC-CON-004", category: "connectors",
    summary: "Housings, pins and a crimp tool, so the wiring on a finished build looks deliberate.",
    price: 6800, stock: 24, tags: ["crimping", "connectors", "wiring"],
    specs: [{ label: "Pitch", value: "2.54 mm" }, { label: "Housings", value: "1 – 6 way" }, { label: "Includes", value: "SN-28B crimp tool" }] },
  { slug: "screw-terminal-blocks", name: "Screw terminal blocks", sku: "VC-CON-005", category: "connectors",
    summary: "PCB-mount terminals for anything that has to be unscrewed later instead of desoldered.",
    price: 1500, stock: 77, tags: ["terminal", "pcb", "screw"],
    specs: [{ label: "Pitch", value: "5.08 mm" }, { label: "Ways", value: "2 and 3, interlocking" }, { label: "Rating", value: "10 A, 300 V" }] },
  { slug: "jst-connector-set", name: "JST connector set", sku: "VC-CON-006", category: "connectors",
    summary: "Polarised plugs, so a battery cannot be reconnected backwards at two in the morning.",
    price: 3200, stock: 45, tags: ["jst", "polarised", "battery"],
    specs: [{ label: "Series", value: "JST-XH 2.54 mm" }, { label: "Ways", value: "2 – 6" }, { label: "Quantity", value: "40 pairs" }] },

    // -------------------------------------------------------- accessories (5)
  { slug: "breadboard-830-point", name: "Solderless breadboard, 830 tie points", sku: "VC-ACC-001", category: "accessories",
    summary: "Full size with power rails both sides, and contacts that still grip after a hundred goes.",
    price: 3500, stock: 71, featured: true, tags: ["breadboard", "prototyping", "solderless"],
    specs: [{ label: "Tie points", value: "830" }, { label: "Rails", value: "2 distribution strips" }, { label: "Pitch", value: "2.54 mm" }] },
  { slug: "breadboard-400-point", name: "Solderless breadboard, 400 tie points", sku: "VC-ACC-002", category: "accessories",
    summary: "Half size, for a single circuit or a project box that will not take the full board.",
    price: 2200, stock: 64, tags: ["breadboard", "compact", "solderless"],
    specs: [{ label: "Tie points", value: "400" }, { label: "Rails", value: "2 distribution strips" }, { label: "Backing", value: "Self-adhesive" }] },
  { slug: "perfboard-stripboard", name: "Perfboard & stripboard", sku: "VC-ACC-003", category: "accessories",
    summary: "Plated through-holes so joints hold on both sides. For when the breadboard version works.",
    price: 1800, stock: 59, tags: ["perfboard", "stripboard", "soldering"],
    specs: [{ label: "Sizes", value: "5×7, 7×9, 9×15 cm" }, { label: "Pitch", value: "2.54 mm" }, { label: "Substrate", value: "FR-4" }] },
  { slug: "battery-snap-connector", name: "9 V battery snap connector", sku: "VC-ACC-004", category: "accessories",
    summary: "The cheapest thing in the shop and the one most often missing when you need it.",
    price: 1000, stock: 98, tags: ["battery", "9v", "consumable"],
    specs: [{ label: "Type", value: "9 V PP3 snap" }, { label: "Lead", value: "150 mm tinned" }, { label: "Quantity", value: "5" }] },
  { slug: "usb-cable-a-to-b", name: "USB cable, A to B", sku: "VC-ACC-005", category: "accessories",
    summary: "The printer-style lead an Uno needs. Data, not charge-only — that distinction costs hours.",
    price: 2500, stock: 52, tags: ["usb", "cable", "arduino"],
    specs: [{ label: "Type", value: "USB-A to USB-B" }, { label: "Length", value: "1.5 m" }, { label: "Data", value: "Yes, shielded" }] },

  // ------------------------------------------------------------- switches (4)
  { slug: "tactile-push-button-switches", name: "Tactile push button switches", sku: "VC-SWI-001", category: "switches",
    summary: "Breadboard-friendly momentary buttons with caps. Debounce them in software.",
    price: 1200, stock: 91, tags: ["button", "momentary", "breadboard"],
    specs: [{ label: "Size", value: "6 × 6 × 5 mm" }, { label: "Type", value: "Momentary, normally open" }, { label: "Quantity", value: "20 with caps" }] },
  { slug: "toggle-switch-spdt", name: "Toggle switch, SPDT", sku: "VC-SWI-002", category: "switches",
    summary: "Panel-mount metal toggle for a power switch you can find without looking.",
    price: 1400, stock: 68, tags: ["toggle", "panel mount", "spdt"],
    specs: [{ label: "Configuration", value: "SPDT, on-off-on" }, { label: "Rating", value: "6 A at 125 V AC" }, { label: "Mounting", value: "6 mm hole" }] },
  { slug: "rocker-switch", name: "Rocker switch", sku: "VC-SWI-003", category: "switches",
    summary: "Illuminated mains rocker for enclosures and power strips. Snaps into a rectangular cutout.",
    price: 1300, stock: 73, tags: ["rocker", "mains", "illuminated"],
    specs: [{ label: "Rating", value: "10 A at 250 V AC" }, { label: "Cutout", value: "21 × 15 mm" }, { label: "Indicator", value: "Neon lamp" }] },
  { slug: "limit-switch-micro", name: "Limit switch (micro switch)", sku: "VC-SWI-004", category: "switches",
    summary: "End stops for CNC axes, printers and anything with a moving part that must not overrun.",
    price: 1600, stock: 57, tags: ["limit switch", "endstop", "cnc"],
    specs: [{ label: "Type", value: "SPDT with roller lever" }, { label: "Rating", value: "5 A at 250 V AC" }, { label: "Operating force", value: "0.5 N" }] },

  // ---------------------------------------------------------------- power (3)
  { slug: "lm2596-buck-converter", name: "LM2596 adjustable buck converter", sku: "VC-PWR-001", category: "power",
    summary: "Step 12 V down to 5 V or 3.3 V without cooking a linear regulator.",
    price: 2200, stock: 66, featured: true, tags: ["buck", "regulator", "dc-dc"],
    specs: [{ label: "Input", value: "4 – 35 V" }, { label: "Output", value: "1.25 – 30 V adjustable" }, { label: "Current", value: "2 A continuous" }] },
  { slug: "tp4056-charging-module", name: "TP4056 lithium charging module", sku: "VC-PWR-002", category: "power",
    summary: "USB-C single-cell charging with protection. Get the version with the second chip.",
    price: 1500, stock: 84, tags: ["charging", "li-ion", "usb-c"],
    specs: [{ label: "Input", value: "USB-C, 4.5 – 5.5 V" }, { label: "Charge current", value: "1 A, settable" }, { label: "Protection", value: "DW01 + FS8205A" }] },
  { slug: "power-adapter-5v-2a", name: "5 V 2 A power adapter", sku: "VC-PWR-003", category: "power",
    summary: "A regulated supply, so the brownouts stop being blamed on the code.",
    price: 5500, stock: 38, tags: ["adapter", "psu", "5v"],
    specs: [{ label: "Output", value: "5 V DC, 2 A" }, { label: "Plug", value: "2.1 mm barrel, centre positive" }, { label: "Input", value: "220 – 240 V AC" }] },

  // -------------------------------------------------------- fluid control (2)
  { slug: "submersible-water-pump-5v", name: "Submersible water pump, 5 V", sku: "VC-FLU-001", category: "fluid-control",
    summary: "Small enough to run off a board's supply. Automatic watering and fountain projects.",
    price: 4800, stock: 34, tags: ["pump", "irrigation", "submersible"],
    specs: [{ label: "Supply", value: "3 – 6 V DC" }, { label: "Flow", value: "120 L/h" }, { label: "Lift", value: "0.4 – 1.1 m" }] },
  { slug: "solenoid-water-valve-12v", name: "Solenoid water valve, 12 V", sku: "VC-FLU-002", category: "fluid-control",
    summary: "Normally closed half-inch valve. Switch it with a relay, never straight off a GPIO pin.",
    price: 11500, stock: 16, tags: ["valve", "solenoid", "irrigation"],
    specs: [{ label: "Supply", value: "12 V DC, 0.5 A" }, { label: "Thread", value: '1/2" BSP' }, { label: "Type", value: "Normally closed" }] },
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
    const haystack = [p.name, p.sku, p.summary, p.category, ...p.tags].join(" ").toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  return PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, limit);
}

/** Low stock is a real signal — it decides whether someone orders today. */
export function stockLabel(stock: number): { text: string; tone: "in" | "low" | "out" } {
  if (stock <= 0) return { text: "Out of stock", tone: "out" };
  if (stock <= 10) return { text: `Only ${stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
}
