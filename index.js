const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vzdnu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const packagesCollection = client.db("dream-weaver").collection("packages");
        const reviewsCollection = client.db("dream-weaver").collection("reviews");
        const ordersCollection = client.db("dream-weaver").collection("orders");



        // Auth
        // http://localhost:5000/login
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send(accessToken);
        })


        // http://localhost:5000/packages
        // app.get('/packages', async (req, res) => {
        //     const query = req.query;
        //     const cursor = packagesCollection.find(query);
        //     const packages = await cursor.toArray();
        //     packages.sort((a, b) => a.price - b.price);
        //     res.send(packages);
        // })
        app.get('/packages', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const cursor = packagesCollection.find({});
            const count = await packagesCollection.estimatedDocumentCount();
            const packages = await cursor.skip(page * size).limit(size).toArray();
            if (!packages.length) {
                res.send({ success: false, error: 'Product not found' });
            }
            res.send({ packages, count });
        })

        // http://localhost:5000/packageCount
        // app.get('/packageCount', async (req, res) => {
        //     const count = await packagesCollection.countDocuments();
        //     res.send({ count });
        // })

        // http://localhost:5000/package/id
        app.get('/package/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const package = await packagesCollection.findOne(query);
            res.send(package)
        })

        // http://localhost:5000/package/id
        app.delete('/package/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const package = await packagesCollection.deleteOne(query);
            res.send(package)
        })

        // http://localhost:5000/reviews
        app.get('/reviews', async (req, res) => {
            const query = req.query;
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // http://localhost:5000/addpackage
        app.post('/addpackage', async (req, res) => {
            const package = req.body;
            const result = await packagesCollection.insertOne(package);
            res.send(result);
        })

        // http://localhost:5000/addorder
        app.post('/addorder', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        // http://localhost:5000/orders
        // https://secret-basin-49124.herokuapp.com/
        app.get('/orders', verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const cursor = ordersCollection.find({ email });
                const orders = await cursor.toArray();
                res.send(orders);
            } else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Dream Weaver is running')
})

app.listen(port, () => {
    console.log('Dream Weaver server is running on port -', port);
})
