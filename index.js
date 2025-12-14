require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// middleware
app.use(express.json());
app.use(cors());

const admin = require("firebase-admin");

const serviceAccount = require("./assetverse_firebase_adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString(
//   'utf-8'
// )

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@t-mongo.m4mnwdk.mongodb.net/?appName=T-mongo`;

const verifyFBToken = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  if (!token) return res.status(401).send({ message: "Unauthorized Access!" });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.tokenEmail = decoded.email;

    next();
  } catch (err) {
    console.log(err);
    return res.status(401).send({ message: "Unauthorized Access!", err });
  }
};

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
    const requestCollections = db.collection("requests");
    const paymentCollections = db.collection("payments");

    // users api

    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const result = await usersCollections.insertOne(userInfo);
      res.send(result);
    });

    app.get("/users/role", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      const user = await usersCollections.findOne({ email });
      if (!user) return res.status(404).send({ message: "User not found" });

      res.send({ role: user.role });
    });

    app.get("/user/hr", verifyFBToken, async (req, res) => {
      const email = req.tokenEmail;
      const hr = await usersCollections.findOne({ email });
      if (!hr) return res.status(404).send({ message: "HR not found" });

      res.send(hr);
    });
   
    // asset api
    app.post("/add-asset", verifyFBToken, async (req, res) => {
      try {
        const userEmail = req.tokenEmail;

        const hrInfo = await usersCollections.findOne({ email: userEmail });

        if (!hrInfo) {
          return res.status(404).send({ message: "HR user not found" });
        }
        const assetData = req.body;
        assetData.hrEmail = userEmail;
        assetData.companyName = hrInfo.companyName;
        assetData.dateAdded = new Date();
        const result = await assetCollections.insertOne(assetData);
        res.send(result);
      } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Failed to add asset", error: err });
      }
    });

    app.get("/assets-list", verifyFBToken, async (req, res) => {
      const result = await assetCollections
        .find({ hrEmail: req.tokenEmail })
        .toArray();
      res.send(result);
    });

    app.get("/all-assets", async (req, res) => {
      const result = await assetCollections.find().toArray();
      res.send(result);
    });

    app.get("/request-asset", verifyFBToken, async (req, res) => {
      const result = await requestCollections
        .find({ hrEmail: req.tokenEmail })
        .toArray();
      res.send(result);
    });
    app.get("/affiliated-employee", verifyFBToken, async (req, res) => {
      const result = await requestCollections
        .find({ hrEmail: req.tokenEmail, status: "approved" })
        .toArray();
      res.send(result);
    });

    app.post("/request-asset", verifyFBToken, async (req, res) => {
      const { productId, employeeName, quantity } = req.body;
      const employeeEmail = req.tokenEmail;
      if (!productId || !employeeName || !quantity) {
        return res.status(400).send({ message: "Missing fields" });
      }
      const asset = await assetCollections.findOne({
        _id: new ObjectId(productId),
      });
      if (!asset) return res.status(404).send({ message: "Asset not found" });

      const hr = await usersCollections.findOne({ email: asset.hrEmail });
      const companyName = hr?.companyName || "";
      const hrEmail = hr?.email || "";

      const requestData = {
        productId,
    productName: asset.productName,
    productImage: asset.productImage,
    productType: asset.productType, 
    companyName: hr?.companyName || "",

    employeeName,
    employeeEmail,
    quantity: Number(quantity),

    hrEmail: asset.hrEmail,

    status: "pending",
    requestDate: new Date(),
    
      };
      const result = await requestCollections.insertOne(requestData);
      res.send({ message: "Request submitted", requestId: result.insertedId });
    });

    app.patch(`/request-asset/:id`, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const request = await requestCollections.findOne({
        _id: new ObjectId(id),
      });
      if (!request) {
        return res.status(404).send({ message: "Request not found" });
      }
      const {
        productId,
        quantity,
        employeeEmail,
        hrEmail,
        status: currentStatus,
      } = request;

      const hrUser = await usersCollections.findOne({ email: hrEmail });

      if (!hrUser) return res.status(404).send({ message: "HR not found" });

      if (currentStatus !== "approved" && updatedData.status === "approved") {
        const alreadyApproved = await requestCollections.findOne({
          employeeEmail,
          hrEmail,
          status: "approved",
        });

        if (!alreadyApproved) {
          if (hrUser.packageLimit <= 0) {
            return res.status(403).send({
              message: "Employee limit reached. Please upgrade your package.",
              paymentRequired: true,
            });
          }
        }
        const asset = await assetCollections.findOne({
          _id: new ObjectId(productId),
        });
        if (!asset) return res.status(404).send({ message: "Asset not found" });

        if (asset.availableQuantity < quantity) {
          return res
            .status(400)
            .send({ message: "Not enough asset quantity available" });
        }
        await assetCollections.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { availableQuantity: -quantity } }
        );
        if (!alreadyApproved) {
          await usersCollections.updateOne(
            { email: hrEmail },
            {
              $inc: {
                packageLimit: -1,
                currentEmployees: 1,
              },
            }
          );
        }
      }

      const result = await requestCollections.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send({ success: true, updated: request.modifiedCount, result });
    });

    app.delete(`/affiliated-employee/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const request = await requestCollections.findOne({
        _id: new ObjectId(id),
      });
      if (!request) {
        return res.status(404).send({ message: "Request not found" });
      }
      if (request.status === "approved") {
        await usersCollections.updateOne(
          { email: request.hrEmail },
          {
            $inc: {
              packageLimit: 1,
              currentEmployees: -1,
            },
          }
        );
      }

      const result = await requestCollections.deleteOne(query);

      res.send(result);
    });

    app.delete(`/assets-list/:id`, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assetCollections.deleteOne(query);
      res.send(result);
    });
    app.patch(`/assets-list-update/:id`, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedData,
      };
      const result = await assetCollections.updateOne(query, updateDoc);
      res.send(result);
    });

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

    // payments api

    app.post("/create-checkout-session", verifyFBToken, async (req, res) => {
      const paymentInfo = req.body;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: paymentInfo?.packageName,
                description: `Employee limit: ${paymentInfo?.employeeLimit}`,
              },
              unit_amount: paymentInfo?.price * 100,
            },
            quantity: 1,
          },
        ],
        customer_email: paymentInfo?.customer.email,
        mode: "payment",
        metadata: {
          packageId: String(paymentInfo?.packageId),
          customerName: String(paymentInfo?.customer?.name),
        },
        success_url: `${process.env.CLIENT_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_DOMAIN}/dashboard/payment`,
      });
      res.send({ url: session.url });
    });

    app.post("/payment-success", async (req, res) => {
      try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        const packageId = session.metadata.packageId;
        const customerEmail = session.customer_email;

        const paymentTran = await paymentCollections.findOne({
          transectionId:session.payment_intent,
        });

        if (paymentTran) {
          return res.send({
            success: true,
            message: "Payment already processed",
          });
        }
        
        if (session.payment_status !== "paid") {
          return res
            .status(400)
            .send({ message: "Payment was not successful" });
        }

       

        const pack = await packageCollections.findOne({
          _id: new ObjectId(packageId),
        });

        if (!pack)
          return res.status(404).send({ message: "Package not found" });

          await usersCollections.updateOne(
          { email: customerEmail },
          {
            $inc: { packageLimit: pack.employeeLimit },
            $set: { lastPackageName: pack.name },
          }
        );

       

        const orderInfo = {
          packageId: session.metadata.PackageId,
          transectionId: session.payment_intent,
          customerEmail: session.customer_email,
          price: session.amount_total / 100,
          paymentStatus: session.payment_status,
          date: new Date().toLocaleString(),
        };
        try {
          await paymentCollections.insertOne(orderInfo);
          res.send({
            success: true,
            message: "Payment processed & saved",
          });
        } catch (err) {
          // In case another request already inserted it
          console.log("Payment already inserted:", err.message);
        }
      } catch (err) {
        console.log(err);
        return res.status(500).send({ message: "Server error", error: err });
      }
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
