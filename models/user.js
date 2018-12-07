const mongoose = require('mongoose');

// keeping it basic for now
const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  },
  password: { type: String, required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
});

module.exports = mongoose.model('User', userSchema);

/*
// this requires additional work and will depend on how the amendment/scoring process plays out, cycles of amendments, applying to different pieces of legislation, etc.
const userSchema = mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  party: { type: String, required: true },
  access_to: [{ // which legNum's does this user have access to vote on/file amendments to
    legNum: { type: Number, required: true },
    amendmentAccess: { type: Boolean, required: true, default: 0 },
    votingAccess: { type: Boolean, required: true, default: 0 }
  }],
  amendments_filed: [{
    legNum: { type: Number }, // which piece of legislation (should be numbered?)
    amendNum: { type: Number },
    text: { type: String },
    points: { type: Number }, // points earned for filing this amendment
    date: { type: Date, default: new Date() }
  }],
  amendments_voted_on: [{
    legNum: { type: Number, requied: true },
    amendNum: { type: Number, required: true },
    vote: { type: Number }, // can't be Boolean in case person doesn't vote (0: no, 1: didn't vote, 2: yes)
    points: { type: Number } // points earned by user for voting on this amendment
  }],
  legislation_voted_on: [{
    legNum: { type: Number, required: true },
    vote: { type: Number }, // can't be Boolean in case person doesn't vote (0: no, 1: didn't vote, 2: yes)
    points { type: Number } // points earned by user for voting on this legislation
  }],
  points: { type: Number, required: true, default: 0 },
  badges: [Number], // if I do it this way?
  invited_by: { type: String }, // which _id (or email?) invited this person
  sent_invite_to: [String] // which emails this person has invited to participate
});




// "0001" can be the legNum, so each collection is only the amendments for that piece of legislation
// alternative is to have an amendmentSchema with each amendment for each legNum all in the same database, which could get big and messy
const amendment0001Schema = mongoose.Schema({
  amendNum: { type: Number, required: true }, // autoincrement this
  filed_by: { type: String, required: true }, // _id of person who filed it
  party: { type: String, required: true },
  date: { type: Date, default: new Date() },
  text: { type: String },
  votes: [{
    voter: { type: String, required: true }, // _id of person who voted
    party: { type: String , rquired: true },
    vote: { type: Number }, // can't be Boolean in case person doesn't vote (0: no, 1: didn't vote, 2: yes)
    points: { type: Number } // points earned by FILER (not voter)
  }],
  points: { type: Number, required: true, default: 0 }, // total points earned by FILER (not voter)
});




const legSchema = mongoose.Schema({
  name: { type: String, required: true }, // name of legislation
  legNum: { type: Number, required: true },
  amendments: [amendment0001Schema],
  repo: { type: String, required: true },
  votes: [{
    voter: { type: String, required: true },
    party: { type: String, required: true },
    vote: { type: Boolean, required: true }
  }]
});



*/