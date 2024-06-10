const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const stripe = require("stripe")('sk_test_51PMA7QA81dfuIgiUxVaApmetDQ5pqxvJcM1veavP369tMDe2LRtZuu7LpP6V9aA6fu3MX7tlHgQzfu71Rm8yr1gR00ENkx79NW')
require('dotenv').config();
const port = process.env.PORT || 5000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://assignment-12-supremacy.web.app',
    'https://assignment-12-supremacy.firebaseapp.com'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.static("public"));


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
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'Unauthorized Access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Unauthorized Access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // use Verify admin after verifyToken 
    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email
    //   const query = { email: email }
    //   const result = await usersCollection.findOne(query)
    //   const isAdmin = result?.role === 'admin'
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: "Forbidden Access" })
    //   }
    //   next()
    // }














    //          <-------- Contest related API -------->

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

    //get Particular contest with approval
    app.get('/contests/approved', async (req, res) => {
      const query = { Approval: true }
      const result = await contestsCollection.find(query).toArray()
      console.log(result);
      res.send(result)
    })

    // to get particular creator's contest related API
    app.get('/creator/contest/:email', async (req, res) => {
      const email = req.params.email
      console.log('creator email:', email);
      const query = { 'Author.Email': email }
      const result = await contestsCollection.find(query).toArray()
      res.send(result)
    })


    // to get applied contest for logged in user API
    app.get('/applied/contest/:email', async (req, res) => {
      const email = req.params.email
      const query = { "Applied.Email": email }
      const result = await contestsCollection.find(query).toArray()
      res.send(result)
    })


    app.get('/winner/contest/:email', async (req, res) => {
      const email = req.params.email
      const query = { "ContestWinner.apply.Email": email }
      const result = await contestsCollection.find(query).toArray()
      res.send(result)
    })





    //to approve the contest API
    app.patch('/contest/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const option = { upsert: false }
      const updateDoc = {
        $set: {
          Approval: true
        }
      }
      const result = await contestsCollection.updateOne(filter, updateDoc, option)
      res.send(result)
    })

    //to set comment to the contest API
    app.patch('/contest/comment/:id', async (req, res) => {
      const id = req.params.id
      const comment = req.body.comment
      console.log('comment is:', comment);
      const filter = { _id: new ObjectId(id) }
      const option = { upsert: true }
      const updateDoc = {
        $set: {
          Comment: comment
        }
      }
      const result = await contestsCollection.updateOne(filter, updateDoc, option)
      res.send(result)
    })

    // contest adding related API
    app.post('/contest', async (req, res) => {
      const contest = req.body
      const result = await contestsCollection.insertOne(contest)
      res.send(result)


    })

    // delete a particular contest
    app.delete('/contest/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await contestsCollection.deleteOne(query)
      res.send(result)
    })

    app.put('/update/contest/:id', async (req, res) => {
      const contest = req.body
      console.log('updated Contest:', contest)
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: false };
      const { ContestName, tag, ContestFee, ContestDescription, Deadline, ContestPrize, Task } = contest
      const updateDoc = {
        $set: {
          ContestName: ContestName,
          ContestFee: ContestFee,
          ContestDescription: ContestDescription,
          Deadline: Deadline,
          ContestPrize: ContestPrize,
          Task: Task,
          tag: tag
        },
      };
      const result = await contestsCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })



    //Applied user post related API
    app.put('/applied/contest/:id', async (req, res) => {
      const id = req.params.id
      const user = req.body
      console.log('applied user', id, user)
      //  const filter = {_id: new ObjectId(id)}
      //  const updateDoc = {
      //   $push: { Applied: user }
      //  }
      const result = await contestsCollection.updateOne({ _id: new ObjectId(id) },
        { $push: { Applied: user } })
      res.send(result)
    })


    app.patch('/winner/contest/:id', async (req, res) => {
      const id = req.params.id
      const user = req.body
      const { Email, Name, Photo } = user
      console.log('winner user:', Email, Name, Photo)
      const filter = { _id: new ObjectId(id) }
      const docUpdate = {
        $set: {
          ContestWinner: user
        }
      }
      const result = await contestsCollection.updateOne(filter, docUpdate)
      res.send(result)
    })

















    //          <--------- Users related API -------->

    // to get all users
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })


    // to get the admin from users
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })


    // to get the creator from users
    app.get('/users/creator/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let creator = false
      if (user) {
        creator = user?.role === 'creator'
      }
      res.send({ creator })
    })


    //  to get the user from users
    app.get('/users/user/:email', async (req, res) => {
      const email = req.params.email
      console.log(email);
      const query = { email: email }
      const account = await usersCollection.findOne(query)
      console.log('user check user:', account)
      let user = false
      if (account) {
        user = account?.role === 'user'
      }
      console.log('user is:', user)
      res.send({ user })
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
    app.delete('/users/:id', verifyToken, async (req, res) => {
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
    app.patch('/users/creator/:id',verifyToken, async (req, res) => {
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



    app.patch('/user/block/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const status = req.body.toggle
      console.log('status is:', status);
      const filter = { _id: new ObjectId(id) }
      const option = { upsert: true }
      const updateDoc = {
        $set: {
          Status: status
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, option)
      res.send(result)
    })


    //     <------ Card Payment related API -------->



    // app.post("/create-payment-intent", async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price * 100);
    //   console.log(amount, 'amount inside the intent')

    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types:['card'],
    //     automatic_payment_methods: {enabled: true,
    //     }
    //   });

    //   res.send({
    //     clientSecret: paymentIntent
    //   })
    // });







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
  res.send('Victory vault is on');
});

app.listen(port, () => {
  console.log(`Victory vault is running on ${port}`);
});
