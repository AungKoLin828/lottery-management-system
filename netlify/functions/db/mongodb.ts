import {MongoClient} from "mongodb";


const uri = process.env.MONGODB_URI!;


const client = new MongoClient(uri);


let database;


export async function connectDB(){

 if(!database){

    await client.connect();

    database =
    client.db("lottery");

 }

 return database;

}