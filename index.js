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


    // verify token middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Unauthorized Access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // use Verify admin after verifyToken 
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const result = await usersCollection.findOne(query)
      const isAdmin = result?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden Access" })
      }
      next()
    }

    // <--- Contest related API --->

    // get all contest API
    app.get('/contest', async (req, res) => {
      const result = await contestsCollection.find().toArray()
      res.send(result)
    })
    // get particular contest API
    app.get('/contest/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await contestsCollection.findOne(query)
      res.send(result)
    })


    // <--- Users related API --->

    // to get all users
    app.get('/users', async (req, res) => {
      console.log(req.headers)
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // to get the admin from users
    app.get('/users/admin/:email',verifyToken, async (req, res) => {
      const email = req.params.email
      console.log(email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      console.log('admin check user:', user)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      console.log('admin is:',admin)
      res.send({ admin })
    })

    
    // to get the creator from users
    app.get('/users/creator/:email',verifyToken, async (req, res) => {
      const email = req.params.email
      console.log(email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      console.log('creator check user:', user)
      let creator = false
      if (user) {
        creator = user?.role === 'creator'
      }
      console.log('creator is:',creator)
      res.send({ creator })
    })


    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email
      console.log(email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      console.log('admin check user:', user)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      console.log('admin is:',admin)
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
    // to make user Creator
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

    // to make user a user
    app.patch('/users/user/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'user'
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
