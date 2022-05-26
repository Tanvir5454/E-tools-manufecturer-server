const express = require('express')
const app = express()
var cors = require('cors')
require("dotenv").config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// middle wear
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jor48.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const toolsCollection = client.db('Manufacturer').collection('tools')
        const ordersCollection = client.db('Manufacturer').collection('orders')
        const userCollection = client.db('Manufacturer').collection('user')
        const reviewCollection = client.db('Manufacturer').collection('review')
        const paymentCollection = client.db('Manufacturer').collection('payments')

        // -----------------------Get all tools data-------------------------------
        app.get('/tools', async (req, res) => {
            const query = await toolsCollection.find().toArray()
            res.send(query)
        })

        // ---------------------Get a single tool data-----------------------------
        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await toolsCollection.findOne(query)
            res.send(result)
        })

        // ------------------------Get all order wih email-------------------------
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const result = await ordersCollection.find(filter).toArray()
            res.send(result)
        })
        // ------------------------Get single order wih id-------------------------
        app.get('/orders/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await ordersCollection.findOne(filter)
            res.send(result)
        })

        // --------------------------patch order ----------------------------------
        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id
            const payment = req.body
            const filter = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedPayment = await ordersCollection.updateOne(filter,updateDoc)
            const result = await paymentCollection.insertOne(payment)
            res.send(updateDoc)
        })

        // ------------------------Post order collection ---------------------------
        app.post('/orders', async (req, res) => {
            const data = req.body
            const result = await ordersCollection.insertOne(data)
            res.send(result)
        })

        // -----------------------Delete single order----------------------------
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(filter)
            res.send(result)
        })

        // ------------------------Get all user data---------------------------------
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await userCollection.findOne(filter)
            res.send(result)
        })

        // ------------------------Post user data------------------------------------
        app.post('/user', async (req, res) => {
            const data = req.body
            const result = await userCollection.insertOne(data)
            res.send(result)
        })

        // ------------------------Put user data-------------------------------------
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        })

        // -------------------------Get Review data------------------------------------
        app.get('/ratings', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        // -------------------------Post Review data-----------------------------------
        app.post('/rating', async (req, res) => {
            const data = req.body
            const result = await reviewCollection.insertOne(data)
            res.send(result)
        })

        // --------------------------post create-payment-intent------------------------
        app.post('/create-payment-intent', async (req, res) => {
            const payment = req.body;
            const price = payment.price
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": ["card"],
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        })

    }

    finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello e-tools manufacturing World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})