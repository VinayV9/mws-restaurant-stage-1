/**
 * Common database helper functions.
 */
let idbName = "restaurants";
let objectStoreName = "restaurantStore";
let reviewsObjectStoreName = "reviewsStore";

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    this._dbPromise = openIndexDb();
    this._dbPromise.then(function (db) {
      let transaction = db.transaction(objectStoreName, 'readonly');
      let objectStore = transaction.objectStore(objectStoreName);

      objectStore.count()
        .then((res) => {
          let condition = navigator.onLine ? "online" : "offline";
          if (res === 0) {
            console.log("conditon : " + condition);
            if (condition === "online") {
              fetch(DBHelper.DATABASE_URL)
                .then((res) => res.json())
                .then((data) => {
                  callback(null, data);
                  let dbPromise = openIndexDb();
                  dbPromise.then(function (db) {
                    if (!db) return;
                    let tx = db.transaction(objectStoreName, 'readwrite');
                    let store = tx.objectStore(objectStoreName);
                    data.forEach(function (message) {
                      store.put(message);
                    });
                  })

                });
            } else {
              alert("sorry! you are offline. Please connect to internet");
            }
          } else {
            let index = db.transaction(objectStoreName)
              .objectStore(objectStoreName);

            return index.getAll().then(function (restaurants) {
              callback(null, restaurants);
            });
          }

        });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    let photograph = restaurant.photograph;
    if (photograph === undefined) {
      photograph = 10;
    }
    return (`/img/${photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  static submitReview(review) {
   
    //check if user online or offline
    if (!navigator.onLine) {
      DBHelper.sendReviewWhenOnline(review);
      return;
    }
    
    let fetchOptions = {
      method: "POST",
      body: JSON.stringify(review),
      headers: new Headers({
        "content-Type": "application/json"
      })
    }

    fetch(`http://localhost:1337/reviews/`, fetchOptions)
    .then(response => {
        const contentType = response.headers.get("content-Type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return response.json();
        } else {
          console.log("api call successful");
        }
    })
    .then(data => {
        console.log("fetch successfull")
    })
    .catch(error => {
        console.log("error occured in review fetch " + error);
    });


  }

  static updateFavoriteStatus(restaurant_id, isFavorite) {
    console.log("changing fav status on server");
    let isFavoriteString = isFavorite.toString();

    fetch(`http://localhost:1337/restaurants/${restaurant_id}/?is_favorite=${isFavoriteString}`, {
      method: 'PUT'
    })
    .then(() => {
      console.log("yay! changed fav on server");
      let dbPromise = openIndexDb();
      dbPromise.then((db) => {

        let tx = db.transaction(objectStoreName, 'readwrite');
        let store = tx.objectStore(objectStoreName);
        console.log("opening the objectstore");


        store.get(restaurant_id).then(restaurant => {
          restaurant.is_favorite = isFavoriteString;
          console.log("update server check type of is_favorite " + restaurant.is_favorite);
          console.log(typeof restaurant.is_favorite);
          console.log("isFavorite " + isFavorite);

          store.put(restaurant);
          console.log("putting updated restaurant in objectstore");

        });
      })

    })

  }

  static sendReviewWhenOnline(offlineReview) {
    //store the review in localstorage
    localStorage.setItem("review", JSON.stringify(offlineReview));
    //set listener to check when the user comes online using `onLine` eventListener
    window.addEventListener('online', function () {
      let review = JSON.parse(localStorage.getItem('review'));
      // pass this review from localstorage to server
      if (review !== null) {
        DBHelper.submitReview(review);
        localStorage.removeItem('review');
      }
    });
  }

  static fetchReviewsFromReviewsEndPoint(id,callback){
    let fetchUrl =  `http://localhost:1337/reviews/?restaurant_id=${id}`;
    
    fetch(fetchUrl)
    .then(response => response.json())
    .then(reviews => {
      callback(null,reviews);
      let dbPromise = openIndexDb();

      dbPromise.then(function(db) {
         if (!db) return;
         let tx = db.transaction(reviewsObjectStoreName, 'readwrite');
         let store = tx.objectStore(reviewsObjectStoreName);
         if(Array.isArray(reviews)){
             reviews.forEach(function(review) {
                store.put(review);
             });
         }else{
             store.put(reviews);
         }
      });
    });
  }

}

/**
 * 
 */
function openIndexDb() {

  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open(idbName, 2, function (upgradeDb) {
    switch(upgradeDb.oldVersion){
        case 0:
           var store = upgradeDb.createObjectStore(objectStoreName, { keyPath: 'id' });
        case 1:
           var store = upgradeDb.createObjectStore(reviewsObjectStoreName, { keyPath: 'id' });
    }
  });
}
