#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// Configuración de la pantalla OLED
#define SCREEN_WIDTH 128 // Ancho de la pantalla OLED en píxeles
#define SCREEN_HEIGHT 64 // Alto de la pantalla OLED en píxeles
#define OLED_RESET -1    // Reset de la pantalla (usualmente no se necesita)
#define OLED_ADDR 0x3C   // Dirección I2C de la pantalla OLED

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Pines y variables sensor de presión
const int sensorPin = 34; // Pin analógico en ESP32 (usar un pin ADC como 34)
const int numReadings = 10; // Número de lecturas para el promediado
float readings[numReadings]; // Array para almacenar lecturas
int readIndex = 0; // Cambio de nombre de 'index' para evitar conflicto
float total = 0;
float average = 0;
float filteredVoltage = 0; // Salida del filtro exponencial
const float alpha = 0.1;  // Factor de suavizado (0.1 = 10% peso)

// Pines y variables del encoder
const int encoderPinA = 18; // Cambiar a un pin adecuado en ESP32
const int encoderPinB = 19; // Cambiar a un pin adecuado en ESP32

// Variables para almacenar los pulsos
volatile long pulseCount = 0;

// Parámetros del sistema
const float diametroRueda = 0.066; // Diámetro de la rueda en metros
const float wheelCircumference = 3.1416 * diametroRueda; // Circunferencia de la rueda en metros
const int pulsesPerRevolution = 5000; // Pulsos por vuelta del encoder

// Distancia por pulso
const float distancePerPulse = wheelCircumference / pulsesPerRevolution;

// Variables para controlar la frecuencia de muestreo
unsigned long previousMillis = 0;
const int sampleInterval = 100; // Intervalo en milisegundos (100 ms = ~10 Hz)

void setup() {
  Serial.begin(2000000); // Cambiar la velocidad a 115200 para ESP32
  
  // Configurar los pines del encoder
  pinMode(encoderPinA, INPUT);
  pinMode(encoderPinB, INPUT);
  
  // Inicializar el buffer de lecturas a cero
  for (int i = 0; i < numReadings; i++) {
    readings[i] = 0;
  }
  
  // Habilitar interrupciones en el pin A
  attachInterrupt(digitalPinToInterrupt(encoderPinA), updateEncoder, RISING);

  // Inicializar la pantalla OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("Fallo en OLED, revisa la conexión"));
    while (true);
  }
  display.clearDisplay();
}

void loop() {
  unsigned long currentMillis = millis();

  // Enviar datos cada intervalo de muestreo
  if (currentMillis - previousMillis >= sampleInterval) {
    previousMillis = currentMillis;

    // Leer voltaje estabilizado
    float voltage = readStableVoltage();
    
    // Convertir los pulsos a distancia en milímetros
    float distance = 2*pulseCount * distancePerPulse;

    // Crear objeto JSON
    StaticJsonDocument<200> doc;
    doc["voltage"] = voltage;
    doc["distance"] = distance;

    // Serializar a JSON y enviar
    serializeJson(doc, Serial);
    Serial.println(); // Nueva línea para finalizar el JSON

    // Mostrar voltaje en la pantalla OLED
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Voltaje:");
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.print(voltage);
    display.println(" V");
    display.display();
  }
}

// Función para leer voltaje estabilizado
float readStableVoltage() {
  // Leer el valor analógico (0 a 4095 en ESP32)
  int sensorPressureValue = analogRead(sensorPin);

  // Convertir el valor analógico a voltaje (ESP32 tiene un rango de 0 a 3.3V)
  float voltage = sensorPressureValue * (3.3 / 4095.0);

  // Filtro de promediado
  total -= readings[readIndex];
  readings[readIndex] = voltage;
  total += readings[readIndex];
  readIndex = (readIndex + 1) % numReadings;
  average = total / numReadings;

  // Filtro de media móvil exponencial
  filteredVoltage = alpha * average + (1 - alpha) * filteredVoltage;

  return filteredVoltage; // Retorna el voltaje filtrado
}

// Función de interrupción para actualizar el conteo de pulsos
void updateEncoder() {
  int LSB = digitalRead(encoderPinB); // Least Significant Bit
  
  if (LSB == HIGH) {
    pulseCount++;
  } else {
    pulseCount--;
  }
}
