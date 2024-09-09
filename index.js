const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'https://vegist-fdd93.web.app/',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ],
    optionsSuccessStatus: 200,
}));
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wj0pjif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
        await client.connect();
        const categoryCollection = client.db("vegistDB").collection("categories");
        const vegetablesCollection = client.db("vegistDB").collection("vegetables");
        const addToCardCollection = client.db("vegistDB").collection("addedCards");
        const userCollection = client.db("vegistDB").collection("users");



        // user related api
        app.post('/user', async (req, res) => {
            const user = req.body
            const query = {email : user?.email};
            const existingUser = await userCollection.findOne(query);
            if(existingUser){
                return res.send({massage : "user already exists" , insertedId : null})
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        })
        app.get('/user', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        // category related api
        app.get('/categories', async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result)
        })
        app.get('/categories/:category', async (req, res) => {
            const { category } = req.params;
            const result = await vegetablesCollection.find({ category: category }).toArray();
            res.send(result)
        })
        app.get('/products', async (req, res) => {
            const result = await vegetablesCollection.find().toArray();
            res.send(result)
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await vegetablesCollection.findOne(query)
            res.send(result)
        })


        // add to card related api
        app.post('/addToCard', async (req, res) => {
            const product = req.body;
            const result = await addToCardCollection.insertOne(product);
            res.send(result);
        })

        app.get('/addToCard', async (req, res) => {
            let query = {};
            if (req?.query?.email) {
                query = { email: req?.query?.email }
            }
            const result = await addToCardCollection.find(query).toArray();
            res.send(result)
        })

        app.delete('/addToCard/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await addToCardCollection.deleteOne(query);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Vegist is running')
})

app.listen(port, () => {
    console.log(`Vegist is running on port ${port}`)
})