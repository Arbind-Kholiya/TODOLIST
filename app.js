//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
mongoose.set('strictQuery', true);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

  mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
  const itemsSchema = new mongoose.Schema({
    name: String
  })

  const Item = mongoose.model('Item', itemsSchema);

  const item1 = new Item({
    name: "Welcome to your todolist!"
  });
  const item2 = new Item({
    name: "Hit the + button to add a new item."
  });
  const item3 = new Item({
    name: "<-- Hit this to delete an item.>"
  });

const defaultItems = [item1 , item2 , item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List" , listSchema)
  

app.get("/", function(req, res) {
  Item.find({} , function(err , items){
    if(items.length === 0){
      Item.insertMany(defaultItems , function(err) {
        if(err){
          console.log(err);
        }
        else{
          console.log("Entered successfully!");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: items});
    }
    
  })
  
});

app.get("/:customListName" , function(req , res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName} , function(err , lists){
    if(!err){
      if(!lists){
        //CREATE LIST
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //SHOWS EXISTING LIST
        res.render("list", {listTitle: lists.name, newListItems: lists.items});
      }
    }
  })
  
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName} , function(err , lists){
      lists.items.push(item);
      lists.save();
      res.redirect("/" + listName);
    })
  }
  
});

app.post("/delete" , function(req , res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId , function(err) {
      if(!err){
        console.log("Deleted successfully!");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName} , {$pull:{items: {_id: checkedItemId}}} , function(err , lists){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
