require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(express.json());
app.use(cors());

const  admin = require("firebase-admin");

 const serviceAccount = require("./assetverse_firebase_adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})


// const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString(
//   'utf-8'
// )


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@t-mongo.m4mnwdk.mongodb.net/?appName=T-mongo`;

const verifyFBToken = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(' ')[1]

  console.log(token);
  
  if (!token) return res.status(401).send({ message: 'Unauthorized Access!' })
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.tokenEmail = decoded.email
    console.log(decoded)
    next()
  } catch (err) {
    console.log(err)
    return res.status(401).send({ message: 'Unauthorized Access!', err })
  }
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const db = client.db("assetverse");
    const packageCollections = db.collection("packages");
    const featuresCollections = db.collection("features");
    const usersCollections = db.collection("users");
    const assetCollections = db.collection("assets");

    // users api

    app.post('/users',async(req,res)=>{
      const userInfo=req.body;
      const result=await usersCollections.insertOne(userInfo)
      res.send(result)
    })
    // asset api
     app.post('/add-asset',async(req,res)=>{
      const userInfo=req.body;
      const result=await assetCollections.insertOne(userInfo)
      res.send(result)
     })

     app.get("/assets-list",verifyFBToken,async (req, res) => {
      
      const result = await assetCollections.find({hrEmail:req.tokenEmail}).toArray();
      res.send(result);
    });
    app.delete(`/assets-list/:id`,async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await assetCollections.deleteOne(query)
      res.send(result)

    })
    app.patch(`/assets-list-update/:id`,async(req,res)=>{
      const id=req.params.id
      const updatedData=req.body
      const query={_id: new ObjectId(id)}
      const updateDoc={
        $set:updatedData
      }
      const result=await assetCollections.updateOne(query,updateDoc)
      res.send(result)
    })
     

    // package api

    app.get("/packages", async (req, res) => {
      const result = await packageCollections.find().toArray();
      res.send(result);
    });
    // feature apis
    app.get("/features", async (req, res) => {
      const result = await featuresCollections.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("VerseAsset..");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
