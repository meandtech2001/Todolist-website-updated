const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { stringify } = require("querystring");

const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://priyaDB:<password>@cluster0.xes3k.mongodb.net/todolistDB");

const options ={
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
};

const today = new Date();

const day = today.toLocaleDateString("en-GB", options);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({name: "Work"});
const item2 = new Item({name: "Study"});
const item3 = new Item({name: "Play"});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema] 
};

const List = mongoose.model("List", listSchema);

//todo list
app.get("/",function(req,res){

    Item.find(function(err,foundItems){
        if(foundItems.length === 0 ){ 
            Item.insertMany(defaultItems,function(err){
                if(err){ console.log(err);}
                else{ console.log("inserted");}
            });
         res.redirect("/");
        }
        else{ 
            res.render("list",{listtitle  : day, newitem : foundItems});
        }
    });

});


app.post("/",function(req,res){
    
    const itemName = req.body.listitem;
    const listName = req.body.list;

    const itemDoc = new Item({
        name: itemName
    });

    if(listName === day){
        itemDoc.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(itemDoc);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
   
});

app.get("/custom",function(req,res){
    res.render("custom");
  });

//custom list
app.get("/:customList", function(req,res){
    const customListName = _.capitalize(req.params.customList);

    List.findOne({name: customListName}, function(err,foundList){
        if(!err){
            if(!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                //show the list
                res.render("list",{listtitle  : foundList.name, newitem : foundList.items});
            }
        }
    });   
});

app.post("/delete",function(req,res){
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day){
        Item.deleteOne({_id: checkedItemID},function(err){
            if(!err){ console.log("Deleted");}
        });
        res.redirect("/");
    }
    else{
       List.findOneAndUpdate( {name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err){
        if(!err){ res.redirect("/" + listName);
      console.log(listName);}
       });
       
    }
});


app.post("/custom",function(req,res){
    const customListName = _.capitalize(req.body.customList);
    res.redirect("/" + customListName);
  });

let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
