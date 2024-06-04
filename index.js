const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());


console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k4uag68.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const contestsCollection = client.db('supremacy').collection('contests')
    const usersCollection = client.db('supremacy').collection('users')


    // <--- JWT API TOKEN ---->


    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" })
      res.send({ token })
    })



    // <--- Contest related API --->

    app.get('/contest', async (req, res) => {
      const result = await contestsCollection.find().toArray()
      res.send(result)
    })

    app.get('/contest/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await contestsCollection.findOne(query)
      res.send(result)
    })


    // <--- Users related API --->

    app.get('/users', async (req, res) => {
      console.log(req.headers)
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email      
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      console.log(admin)
      res.send({ admin })
    })


    // to add non existed user
    app.post('/users', async (req, res) => {
      const user = req.body
      const query = { email: user.email }
      const foundEmail = await usersCollection.findOne(query)
      if (foundEmail) {
        return res.send({ message: 'User Already existed.', insertedId: null })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    //to delete users by Admin
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    //to make user admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    //to make user contest creator
    app.patch('/users/creator/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'creator'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
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
  res.send('Victory vault is on');
});

app.listen(port, () => {
  console.log(`Victory vault is running on ${port}`);
});
