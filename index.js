require('dotenv').config()
const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT ||3000
const { MongoClient, ServerApiVersion } = require('mongodb');


// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@t-mongo.m4mnwdk.mongodb.net/?appName=T-mongo`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
   
    const db=client.db('assetverse');
    const packageCollections=db.collection('packages')

    // package api

app.get('/packages',async(req,res)=>{
  const result=await packageCollections.find().toArray()
  res.send(result)
})

     

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('VerseAsset..')
})





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})