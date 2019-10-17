// ######## PROGETTO DUNGEON by VIKSTECH di VITTORIO DOMENICO PADIGLIA #####################
// ######## I SORGENTI SONO FORNITI APERTI E FRUIBILI UNICAMENTE A SCOPO DIDATICO ##########
// ######## E' PROIBITO QUALSIASI USO DI TIPO COMMERCIALE DEL PRESENTE CODICE ##############
// ######## PER INFORMAZIONI SCRIVERE A INFO@VIKSTECH.IT ###################################

// ####### LIBRERIE

// LIBRERIE INTERNE PER CONSENTIRE IL REBOOT
#include <esp_int_wdt.h>
#include <esp_task_wdt.h>

// LIBRERIE PER OLED
#include "SSD1306.h" // alias for `#include "SSD1306Wire.h"'

// LIBRERIE PER CONNESSIONE E MQTT
#include "EspMQTTClient.h"

// LIBRERIA PER GESTIRE JSON
#include "ArduinoJson.h"

// LIBRERIE PER TELECOMANDO
#include <Arduino.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <IRrecv.h>
#include <IRac.h>
#include <IRutils.h>


// ######## VARIABILI EDITABILI

// ID DEL ROBOT (OGNI ROBOT DEVE AVERE UN ID UNICO)
const char* robotID = "123456";
// PIN DOVE VIENE CONNESSA LA RICEVENTE (RX) DEL TELECOMANDO
const uint16_t kRecvPin = 15;
// PIN DOVE VIENE CONNESSA L'EMITTENTE (TX) DEL TELECOMANDO 
const uint16_t kIrLed = 18;  

const char* wifiSSID = "viks";
const char* wifiPASS = "123stella";
const char* mqttBrokerServer = "broker.vikstech.com";
int mqttBrokerPort = 2884;


// ######## IL SEGUENTE CODICE SI CONSIGLIA DI LASCIARLO TALE E QUALE






// DICHIARAZIONE COSTANTI PER USO TELECOMANDO

const uint16_t kCaptureBufferSize = 1024; // AMPIEZZA DEL BUFFER DI LETTURA DEI DATI
#if DECODE_AC
const uint8_t kTimeout = 50;
#else   // DECODE_AC
const uint8_t kTimeout = 15;
#endif  // DECODE_AC
const uint16_t kMinUnknownSize = 12;
// DICHIARAZIONE COSTANTI DEI PULSANTI DEL TELECOMANDO
const String btn_a = "FFA25D"; // TASTO A
const String btn_b = "FF629D"; // TASTO B
const String btn_c = "FFE21D"; // TASTO C
const String btn_d = "FF22DD"; // TASTO D
const String btn_e = "FFC23D"; // TASTO E
const String btn_f = "FFB04D"; // TASTO F
const String cmd_start_game = "FF000CF3FF0050AF";//"FF000CF3";
const String cmd_request_question = "FF008C73FF0050AF";//"FF008C73";
const unsigned long cmd_start_game_ack = 0xFF02FD;
const unsigned long cmd_good_answer = 0xFFA25D; //A
const unsigned long cmd_bad_answer = 0xFF629D; //B
const unsigned long cmd_game_over = 0xFFE21D; //C
const unsigned long cmd_start_game_send = 0xFF22DD; //D
const unsigned long cmd_rx_ack = 0xFFC23D; //E
const unsigned long cmd_victory = 0xFFB04D; //F

// DEFINIZIONE DELLA RICEVENTE DEI SENGALI DEL TELECOMANDO
IRrecv irrecv(kRecvPin, kCaptureBufferSize, kTimeout, true);
// VARIABILE DI APPOGIO DATI RICEVUTI DAL TELECOMANDO
decode_results results;  
// DEFINIZIONE DELL'EMITENTE DEI SENGALI PER IL ROBOT
IRsend irsend(kIrLed); 

// WIFI E MQTT SETTING
EspMQTTClient client(
  wifiSSID, //SSID della WIFI
  wifiPASS, // PASS della WIFI
  mqttBrokerServer,  // MQTT Broker server ip
  "",   // User - Can be omitted if not needed
  "",   // Password - Can be omitted if not needed
  robotID,     // Client name that uniquely identify your device
  mqttBrokerPort              // The MQTT port, default to 1883. this line can be omitted
);
int maxSecondOfWifiInactivity = 30;
int secondOfWifiInactivity = 0;

// OLED SETTING
SSD1306  display(0x3c, 5, 4);

int inquestion = 0;

// INIZIALIZZAZIONE DEL PROGRAMMA
void setup() {
  // INIZIALIZZO IL DISPLAY
  initDisplay();
  // AVVIO DELLA PORTA SERIALE
  Serial.begin(115200, SERIAL_8N1);
  while (!Serial) 
    delay(50);
  Serial.println("Avvio 1");
  printToDisplay("Strt Sys");
 // Optionnal functionnalities of EspMQTTClient : 
  client.enableDebuggingMessages(); // Enable debugging messages sent to serial output
 // client.enableHTTPWebUpdater(); // Enable the web updater. User and password default to values of MQTTUsername and MQTTPassword. These can be overrited with enableHTTPWebUpdater("user", "password").
 // client.enableLastWillMessage("TestClient/lastwill", "I am going offline");  // You can activate the retain flag by setting the third parameter to true
  // AVVIO DELL'EMITENTE
  irsend.begin();
  printToDisplay("Strt IR");
  Serial.printf("\n Sistema avviato\n");
  #if DECODE_HASH
    // Ignore messages with less than minimum on or off pulses.
    irrecv.setUnknownThreshold(kMinUnknownSize);
  #endif                  // DECODE_HASH
    irrecv.enableIRIn();  // Start the receiver
  printToDisplay("Strt RX");
}
 

void initDisplay()
{
  display.init();
  display.flipScreenVertically();
  display.setFont(ArialMT_Plain_24);
}

void printToDisplay(String val)
{
  display.clear();
  display.setColor(WHITE);
  display.setTextAlignment(TEXT_ALIGN_CENTER);
  display.drawString(64, 15, val);
  display.setFont(ArialMT_Plain_24);
  display.display();
}
void onConnectionEstablished()
{
  printToDisplay("Connected");
  delay(2000);
  printToDisplay("ID: "+ String(robotID));
  client.subscribe("iscola/dungeon/"+String(robotID), [](const String & payload) {
    Serial.println(payload);
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    JsonObject obj = doc.as<JsonObject>();
    dispatchCommand(obj);
    
  });
  client.publish("iscola/dungeon/"+String(robotID), "{\"cmd\":\"presence\",\"robotId\":\""+String(robotID)+"\"}"); 
}

void sendToBroker(String cmd){
  Serial.println("invio " + cmd);
  printToDisplay("SendToWeb");
  client.publish("iscola/dungeon/"+String(robotID), cmd);
}

void dispatchCommand(JsonObject obj){
  Serial.println("ricevuto" + obj["cmd"].as<String>());
  String cmd = obj["cmd"].as<String>();
  if (cmd == "newGameStarted"){
    Serial.println("eccolo invio");
    printToDisplay("start_game_ack");
    inquestion = 0;
    irsend.sendNEC(cmd_start_game_ack,32);
  }else if(cmd == "gameOver"){
    Serial.println("GAME OVER");
    inquestion = 0;
    printToDisplay("GAMEOVER");
    irsend.sendNEC(cmd_game_over,32);
  }else if(cmd == "victory"){
    Serial.println("HAI VINTO");
    inquestion = 0;
    printToDisplay("HAIVINTO!");
    irsend.sendNEC(cmd_victory,32);
  }else if(cmd == "goodResponse"){
    Serial.println("GOOD RESPONSE");
    inquestion = 0;
    printToDisplay("GIUSTO!");
    irsend.sendNEC(cmd_good_answer,32);
  }else if(cmd == "badResponse"){
    Serial.println("BAD RESPONSE");
    inquestion = 0;
    printToDisplay("SBAGLIATO!");
    irsend.sendNEC(cmd_bad_answer,32);
  }else if(cmd == "newGameWaitToStart"){
    Serial.println("ENABLE TO START");
    inquestion = 0;
    printToDisplay("Go on Rbt");
    irsend.sendNEC(cmd_start_game_send,32);
  }
}

void startGame(){
  sendToBroker("{\"cmd\":\"newGameStarted\",\"robotId\":\""+String(robotID)+"\"}");
}

void showQuest(int argoument){
  Serial.println("quest req");
  if(inquestion == 0){
    Serial.println("SEND TO WEB");
    inquestion = 1;
    sendToBroker("{\"cmd\":\"question\",\"robotId\":\""+String(robotID)+"\",\"ambit\":1}");
  }
}

void sendIrAck(){
  Serial.println("ACK IR");
  irsend.sendNEC(cmd_rx_ack,32);
}

void hard_restart() {
  esp_task_wdt_init(1,true);
  esp_task_wdt_add(NULL);
  while(true);
}
void loop() {
  client.loop();
  // VERIFICA RICEZIONE MESSAGGI DA MQTT
  if(client.isConnected()){
    if (irrecv.decode(&results)) {
      String incoming = resultToHexidecimal(&results);
      Serial.println("debug "+incoming);
      if (incoming == cmd_start_game){
        //sendIrAck();
        printToDisplay("Start");
        Serial.println("Ho ricevuto il comando di avvio, avvio il gioco dal robot");
        
        startGame();
      }else if (incoming == cmd_request_question){
        sendIrAck();
        printToDisplay("Quest");
        Serial.println("Ho ricevuto la richiesta di una domanda dal robot, la inoltro");
        showQuest(1);
      }else{
        Serial.println(incoming);
       /* printToDisplay("NC<-"+incoming);*/
        
        Serial.println(resultToHumanReadableBasic(&results));
      }
      yield(); 
    }
  }else{
    if (secondOfWifiInactivity >= maxSecondOfWifiInactivity){
      printToDisplay("RESET");
      hard_restart();
    }
      
    secondOfWifiInactivity++;
    printToDisplay("NoWiFi"+String(secondOfWifiInactivity));
    delay(1000);
  }
   
  
  //delay(200);  
  
  
}
