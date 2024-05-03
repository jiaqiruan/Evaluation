const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = async () => {
    // define your method to get cart data
    const data = await fetch(URL+"/cart");
    const res = await data.json();

    /*for(let item of res){
      if(!item.count){
        item.count = 0;
      }
    }*/

    return res;
  };
  const getInventory = async () => {
    // define your method to get inventory data
    const data = await fetch(URL+"/inventory");
    const res = await data.json();

    /*for(let item of res){
      if(!item.count){
        item.count = 0;
      }
    }*/
    return res;
  };

  const getAll = async()=>{
    const cartData = await fetch(URL+"/cart");
    const cartRes = await cartData.json();

    const data = await fetch(URL+"/inventory");
    const res = await data.json();

    return [cartRes,res];
  };

  const addToCart = async (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) =>res.json());
  };

  const updateCart = async (id, newAmount,content) => {
    // define your method to update an item in cart
    const dataToUpdate = {
      id: id, 
      content: content,
      count: newAmount
    };
    //console.log(dataToUpdate);

    return fetch(`${URL}/cart/${id}`,{
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToUpdate)
    }).then((res) =>res.json());
  };

  const deleteFromCart = async (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, { method: "DELETE" }).then((res) =>
      res.json()
    );
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    getAll,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    getAll,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
    getAll,
  };
})();

const View = (() => {
  // implement your logic for View


  const inventoryList = document.querySelector(".inventory-list");
  const cartList = document.querySelector(".cart-list");
  const renderInventorys = (inventorys) =>{
    inventorys.forEach((inventory)=>{
      const liEle = document.createElement(`li`);
      liEle.id = inventory.id;

      const spanElement = document.createElement('span');
      spanElement.setAttribute("class","inventory-content");
      spanElement.innerHTML = inventory.content;
      liEle.appendChild(spanElement);

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = "-";
      deleteButton.setAttribute("class","inventory-delete-btn")
      liEle.appendChild(deleteButton);

      const countElement = document.createElement('span');
      countElement.setAttribute("class","inventory-count");
      countElement.innerHTML = 0;
      liEle.appendChild(countElement);

      const addButton = document.createElement('button');
      addButton.innerHTML = "+";
      addButton.setAttribute("class","inventory-add-btn");
      liEle.appendChild(addButton);

      const cartButton = document.createElement('button');
      cartButton.innerHTML = "add to cart";
      cartButton.setAttribute("class","inventory-cart-btn");
      liEle.appendChild(cartButton);

      inventoryList.appendChild(liEle);
    });
  }

  const renderCarts = (carts) =>{
    carts.forEach((cart)=>{
      const cartEle = document.createElement(`li`);
      cartEle.id = cart.id;

      const spanElement = document.createElement('span');
      spanElement.innerHTML = `${cart.content} x ${cart.count}`;
      cartEle.appendChild(spanElement);

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = 'delete';
      deleteButton.setAttribute("class","cart-delete-btn")
      cartEle.appendChild(deleteButton);

      cartList.appendChild(cartEle);
    });
  }
  return {renderInventorys, renderCarts, cartList,inventoryList};
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = async () => {
    
    const data = await model.getAll();
    state.inventory = data[1];
    state.cart = data[0];
    //console.log(state.inventory);
    //console.log(state.cart);
  };
  const handleUpdateAmount = () => {
    view.inventoryList.addEventListener("click", (event) => {
      const element = event.target;

      if (element.className === "inventory-delete-btn") {
        const count = element.parentElement.querySelector('.inventory-count');
        let countNum = parseInt(count.innerHTML);
        if(countNum>0){
          count.innerHTML = `${parseInt(count.innerHTML) - 1}`;
        }
      }

      if (element.className === "inventory-add-btn") {
        const count = element.parentElement.querySelector('.inventory-count');
        count.innerHTML = `${parseInt(count.innerHTML) + 1}`;
      }

      
    });
  };

  const handleAddToCart = () => {
    view.inventoryList.addEventListener("click", (event) => {
      event.preventDefault();
      const element = event.target;

      if (element.className === "inventory-cart-btn"){
        const content = element.parentElement.querySelector('.inventory-content').innerHTML;
        const amount = parseInt(element.parentElement.querySelector('.inventory-count').innerHTML);
        const id = element.parentElement.getAttribute("id");
        element.parentElement.querySelector('.inventory-count').innerHTML = 0;
        const newCart = {
          content: content,
          id: id,
          count: amount
        };
        //console.log(newCart);
        //console.log(state.cart);
        let inCart = false;
        let index = -1;
        for(let i=0;i<state.cart.length;i++){
          if(state.cart[i].id === id){
            index = i;
            inCart =  true;
            break;
          }
        }

        if(inCart){
          const oldAmount = state.cart[index].count;
          model.updateCart(id,(oldAmount+amount),content).then((res)=>{
            state.cart = state.cart.filter((element)=>element.id!==res.id);
            state.cart = [...state.cart,res];
          });
        }else{
          if(amount>0){
            model.addToCart(newCart).then((data)=>{
              state.cart = [...state.cart,data];
            });
          }
          
        }
      }
    });
  };

  const handleDelete = () => {
    view.cartList.addEventListener("click", (event) => {
      event.preventDefault();
      const element = event.target
      if(element.className === "cart-delete-btn"){
        const id = element.parentElement.getAttribute("id");
        //console.log(id);
        model.deleteFromCart(id).then((data)=>{
          state.cart = state.cart.filter((item)=>item.id !== id);
        });
      }
    });
  };

  const handleCheckout = () => {};

  const bootstrap = () => {
    init();
    state.subscribe(()=>{
      while (view.inventoryList.firstChild) {
        view.inventoryList.removeChild(view.inventoryList.firstChild);
      }
      while (view.cartList.firstChild) {
        view.cartList.removeChild(view.cartList.firstChild);
      }
      view.renderInventorys(state.inventory);
      view.renderCarts(state.cart);

    });
    handleUpdateAmount();
    handleAddToCart();
    handleDelete();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();

