/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initializing Ledger ===========');

        /*
        const patients = [
            {
                FirstName: "Thad",
                LastName: "Allamong",
                Age: "40",
                Sex: "M",
                ChestPainType: "ATA",
                RestingBP: "140",
                Cholesterol: "289",
                FastingBS: "0",
                RestingECG: "Normal",
                MaxHR: "172",
                ExerciseAngina: "N",
                Oldpeak: "0",
                ST_Slope: "Up",
                HeartDisease: "0",
            },
            {
                FirstName: "Johanna",
                LastName: "Cain",
                Age: "49",
                Sex: "F",
                ChestPainType: "NAP",
                RestingBP: "160",
                Cholesterol: "180",
                FastingBS: "0",
                RestingECG: "Normal",
                MaxHR: "156",
                ExerciseAngina: "N",
                Oldpeak: "1",
                ST_Slope: "Flat",
                HeartDisease: "1",
            },
            {
                FirstName: "Perry",
                LastName: "Marotta",
                Age: "37",
                Sex: "M",
                ChestPainType: "ATA",
                RestingBP: "130",
                Cholesterol: "283",
                FastingBS: "0",
                RestingECG: "ST",
                MaxHR: "98",
                ExerciseAngina: "N",
                Oldpeak: "0",
                ST_Slope: "Up",
                HeartDisease: "0",
            },
        ];

        for(let i = 0; i < patients.length; i++) {
            patients[i].docType = 'patient';
            await ctx.stub.putState("PATIENT" + i, Buffer.from(JSON.stringify(patients[i])));
            console.info("Added ---> ", patients[i]);
        }
        */
        console.info('============= END : Initialized Ledger ===========');
    }

    async createPatient(ctx, id, FirstName, LastName, Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope, HeartDisease) {

        const existingAsset = await ctx.stub.getState(id);

        if(existingAsset && existingAsset.length != 0){
            throw new Error(`The patient ${id} already exists!`);
        }

        console.info("Creating Patient: " + id);

        const patient = {
            FirstName: FirstName,
            LastName: LastName,
            Age: Age,
            Sex: Sex,
            ChestPainType: ChestPainType,
            RestingBP: RestingBP,
            Cholesterol: Cholesterol,
            FastingBS: FastingBS,
            RestingECG: RestingECG,
            MaxHR: MaxHR,
            ExerciseAngina: ExerciseAngina,
            Oldpeak: Oldpeak,
            ST_Slope: ST_Slope,
            HeartDisease: HeartDisease,

            HolderMSP: ctx.stub.getCreator()["mspid"].toString(),
            permissionList: [],
            requestList: [],
        };
        
        patient.docType = 'patient';
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(patient)));
    }



    //Verifica che chi sta eseguendo la transazione sia il creatore e proprietario dei dati del paziente.
    selfCheckHolder(ctx,patient){
        return patient.HolderMSP == ctx.stub.getCreator()["mspid"].toString();
    }



    //Verifica che chi sta eseguendo la transazione sia nella lista-permessi per avere il diritto di visualizzare il paziente.
    selfCheckPermissionList(ctx, patient){
        let currentCreatorMSPID = ctx.stub.getCreator()["mspid"].toString();
        return patient.permissionList.includes(currentCreatorMSPID);
    }
    


    //Restituisce come risultato tutti i pazienti che è possibile consultare (in quanto creatori o aventi diritto di accesso).
    //Se non ci sono pazienti che rispettano i criteri appena detti, viene restituita una lista vuota.
    async queryAllPatients(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            if ( this.selfCheckHolder(ctx, record) || this.selfCheckPermissionList(ctx, record)){
                delete record.HolderMSP

                delete record.permissionList;
                delete record.requestList;
                allResults.push({ Key: key, Record: record });
            }
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }


    //Ritorna vero se askingId ha già fatto richiesta per il paziente patient.
    checkRequestList(asking_mspid, patient){
        for(var i=0; i < patient.requestList.length; i++){
            if(patient.requestList[i]["mspid"].toString()==asking_mspid){
                return true;
            }
        return false;
        }
    }

    getAskingIdentityFromRequestList(whoAskedMSP, patient){
        for(var i=0; i < patient.requestList.length; i++){
            if(patient.requestList[i]["mspid"].toString()==whoAskedMSP){
                return patient.requestList[i];
            }
        }
    }

    async requestAccess(ctx, patientId) {
        const whoAsking = ctx.stub.getCreator();
        console.info(whoAsking["mspid"].toString() + ' requests the access for the patient ' + patientId);
        let patient;
        try {
            const strValue = Buffer.from(await ctx.stub.getState(patientId)).toString('utf8');
            patient = JSON.parse(strValue);
        } catch (err) {
            throw new Error("The patient does not exists");
        }

        if (this.selfCheckPermissionList(ctx, patient) || this.selfCheckHolder(ctx, patient)) {
            throw new Error(`Peer of ${whoAsking["mspid"].toString()} already have a permission to access this patient`);
        }
        if (this.checkRequestList(whoAsking["mspid"].toString(), patient)) {
            throw new Error(`Peer of ${whoAsking["mspid"].toString()} already requested to access this patient`);
        }

        patient.requestList.push(whoAsking);

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        console.info("Peer of " + whoAsking["mspid"].toString + ' officially asked permission for patient: ' + patientId);
    }




    async grantAccess(ctx, patientId, whoAskedMSP) {
        console.info("Granting access " +  whoAskedMSP + " for the requested patient " + patientId);
        let patient;
        try {
            const strValue = Buffer.from(await ctx.stub.getState(patientId)).toString('utf8');
            patient = JSON.parse(strValue);
        } catch (err) {
            throw new Error("The patient does not exists");
        }

        if (!this.selfCheckHolder(ctx, patient)) {
            throw new Error(`The actual peer is not the patient holder. Can't grant access.`);
        }
        if (patient.permissionList.includes(whoAskedMSP)) {
            throw new Error(`${whoAskedMSP} already have permission for the patient ` + patientId);
        }
        if(!this.checkRequestList(whoAskedMSP, patient)) {
            throw new Error(`${whoAskedMSP} did not requested permission for this patient!`);
        }

        const askingIdentity = this.getAskingIdentityFromRequestList(whoAskedMSP, patient);

        patient.permissionList.push(askingIdentity["mspid"].toString());
        patient.requestList.pop(askingIdentity);

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        console.info('Granted access for ' + patientId + " to " + whoAskedMSP);
    }
    



    async revokeAccess(ctx, patientId, whoAskedMSP) {
        let patient;
        try {
            const strValue = Buffer.from(await ctx.stub.getState(patientId)).toString('utf8');
            patient = JSON.parse(strValue);
        } catch (err) {
            throw new Error("The patient does not exists");
        }

        if (!this.selfCheckHolder(ctx, patient)) {
            throw new Error(`The actual peer is not the patient holder. Can't grant access.`);
        }
        if (!patient.permissionList.includes(whoAskedMSP)) {
            throw new Error(`${whoAskedMSP} does not already have access permission for ` + patientId);
        }

        patient.permissionList.pop(whoAskedMSP);

        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patient)));
        console.info('Revoked Access for: ' + patientId + " to " + whoAskedMSP);
    }

}

module.exports = FabCar;
