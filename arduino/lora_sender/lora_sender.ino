/*
 * CUHAR LoRa Sender — Flight Simulation Test
 *
 * Board: TTGO LoRa32 V1 / Heltec WiFi LoRa 32 V2 (or any ESP32 + SX1276)
 * Libraries needed (install via Arduino Library Manager):
 *   - LoRa  by Sandeep Mistry
 *   - ArduinoJson  by Benoit Blanchon (v6.x)
 *
 */

#include <ArduinoJson.h>

#define TX_INTERVAL_MS 500

static unsigned long missionStartMs = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}
  missionStartMs = millis();
}

void loop() {
  static unsigned long lastTx = 0;
  if (millis() - lastTx < TX_INTERVAL_MS) return;
  lastTx = millis();

  unsigned long missionMs = millis() - missionStartMs;
  float t = missionMs / 1000.0f;

  const float BURN_START = 3.0f;
  const float BURN_END   = 13.0f;
  const float NET_ACC    = 10.0f;

  float velocity, acceleration;

  if (t < BURN_START) {
    velocity     = 0.0f;
    acceleration = 1.0f; // 1 G idle
  } else if (t < BURN_END) {
    float tb     = t - BURN_START;
    velocity     = NET_ACC * tb;
    acceleration = (NET_ACC + 9.81f) / 9.81f; // ~2 G during burn
  } else {
    float tc     = t - BURN_END;
    float burnEndVz = NET_ACC * (BURN_END - BURN_START);
    velocity     = max(0.0f, burnEndVz - 9.81f * tc);
    acceleration = (velocity > 0.0f) ? 0.0f : 1.0f;
  }

  StaticJsonDocument<128> doc;
  doc["missionTimeMs"] = missionMs;
  doc["velocity"]      = roundf(velocity     * 10.0f) / 10.0f;
  doc["acceleration"]  = roundf(acceleration * 100.0f) / 100.0f;

  String json;
  serializeJson(doc, json);
  Serial.println(json);
}
