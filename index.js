const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'https://vegist-fdd93.web.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ],
    methods: ['GET', 'POST', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// MongoDB connection (persistent)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wj0pjif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    await client.connect();
    cachedClient = client;
    cachedDb = client.db('vegistDB');
    console.log("Connected to MongoDB successfully!");
    return { client, db: cachedDb };
}

async function run() {
    const { db } = await connectToDatabase();

    const categoryCollection = db.collection('categories');
    const vegetablesCollection = db.collection('vegetables');
    const addToCardCollection = db.collection('addedCards');
    const userCollection = db.collection('users');
    const favoriteCollection = db.collection('favorites');

    // User related API
    app.post('/user', async (req, res) => {
        try {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "User already exists", insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        } catch (error) {
            console.error('Error adding user:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    app.get('/user', async (req, res) => {
        try {
            const result = await userCollection.find().toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    // Category related API
    app.get('/categories', async (req, res) => {
        try {
            const result = await categoryCollection.find().toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    app.get('/categories/:category', async (req, res) => {
        try {
            const { category } = req.params;
            const result = await vegetablesCollection.find({ category }).toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching category products:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    // Product related API
    app.get('/products', async (req, res) => {
        try {
            const result = await vegetablesCollection.find().toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    app.get('/products/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await vegetablesCollection.findOne(query);
            res.send(result);
        } catch (error) {
            console.error('Error fetching product by ID:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });
    app.post('/products', async(req , res)=>{
        const product = req.body;
        const result = await vegetablesCollection.insertOne(product);
        res.send(result);
    })

    // Add to card related API
    app.post('/addToCard', async (req, res) => {
        try {
            const product = req.body;
            const query = {product_id : product?.product_id}
            const isAvailable = await addToCardCollection.findOne(query)
            if(isAvailable){
                return res.status(409).send({ message: 'Product is already added to the cart' });
            }
            const result = await addToCardCollection.insertOne(product);
            res.send(result);
        } catch (error) {
            console.error('Error adding product to cart:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    app.get('/addToCard', async (req, res) => {
        try {
            const query = req?.query?.email ? { email: req.query.email } : {};
            const result = await addToCardCollection.find(query).toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });

    app.delete('/addToCard/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await addToCardCollection.deleteOne(query);
            res.send(result);
        } catch (error) {
            console.error('Error deleting cart item:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });


    // favorite added related api
    app.get('/favorite', async (req, res) => {
        try {
            const query = req?.query?.email ? { email: req.query.email } : {};
            const favoriteProducts = await favoriteCollection.find(query).toArray();
            const productIds = favoriteProducts.map(fav => new ObjectId(fav?.product_id));
            if (!productIds || productIds === 0) {
                return res.status(404).send({ message: 'No favorite products found for this email' });
            }
            const result = await vegetablesCollection.find({ _id: { $in: productIds } }).toArray();
            res.send(result)
        } catch (error) {
            console.error('Error adding product to cart:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    })



    app.post('/favorite', async (req, res) => {
        try {
            const query = req.body;
            const p = {product_id: query?.product_id}
            const isAvailable = await favoriteCollection.findOne(p)
            console.log(isAvailable);
            if(isAvailable){
                return res.status(409).send({ message: 'You have already added this product to your cart.' });
            }
            const result = await favoriteCollection.insertOne(query);
            res.send(result)
        }
        catch (error) {
            console.error('Error adding product to cart:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    })

    app.delete('/favorite/:id', async (req, res) => {
        try {
            const id = req.params.id; 
            const query = { product_id: id };
            const favoriteProduct = await favoriteCollection.findOne(query);
    
            if (!favoriteProduct) {
                return res.status(404).send({ message: 'Favorite product not found' });
            }
            const result = await favoriteCollection.deleteOne(query);
    
            res.send(result)
        } catch (error) {
            console.error('Error deleting favorite product:', error);
            res.status(500).send({ message: 'Server Error' });
        }
    });



}

// Initial run of the app
run().catch(console.dir);

// Default route
app.get('/', (req, res) => {
    res.send('Vegist is running');
});

app.listen(port, () => {
    console.log(`Vegist is running on port ${port}`);
});
