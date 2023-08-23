const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
     categoryName:{
          type: String,
          required:[true, "Please enter category"],
          unique:true,
     },
     photoCategory:{
          public_id:{
              type:String,
              required:true
          },
          url:{
              type:String,
              required:true
          }
     },
});

module.exports = mongoose.model("Category", categorySchema);