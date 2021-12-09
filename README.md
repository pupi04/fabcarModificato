# (0) - SOLO LA PRIMA VOLTA: Scaricare le immagini di Fabric.
```
curl -sSL https://bit.ly/2ysbOFE | bash -s

```

# (1) Porsi nella cartella *fabcar* e lanciare la rete.
```
cd fabcar

```
```
./startFabric.sh javascript

```
# (2) Porsi nella cartella *fabcar/javascript* e lanciare i seguenti comandi.
```
cd javascript

```
Lanciare:
```
npm install
```
Registrare ed enrollare 2 admin e 2 users.
```
./registerUsers.sh

```

# (3) A questo punto è possibile "giocare" con la blockchain, usando i seguenti js:
Per fare degli invoke (creare un paziente, dare o revocare permessi:
```
node invokeMSP1.js
node invokeMSP2.js
```
Per fare richiesta di accesso a un paziente specifico:
```
node invokeRequestMSP2.js
```
Per fare una query e vedere tutti i pazienti visualizzabili da Org1 o Org2:
```
node queryMSP1.js
node queryMSP2.js
```

Per entrare in CouchDB e visualizzare i pazienti, scrivere sul browser:
http://localhost:5984/_utils/#login

Username: *admin*
Password: *adminpw*


