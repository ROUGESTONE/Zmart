angular
  .module("zmartApp", ["ngRoute"])
  .config(function ($routeProvider) {
    function authOnly($q, $location, AuthService) {
      if (AuthService.isLoggedIn()) return true;
      var next = $location.path();
      $location.path("/login").search("next", next);
      return $q.reject("AUTH_REQUIRED");
    }
    function adminOnly($q, $location, AuthService) {
      if (
        AuthService.currentUser() &&
        AuthService.currentUser().role === "admin"
      )
        return true;
      $location.path("/login");
      return $q.reject("ADMIN_REQUIRED");
    }
    $routeProvider
      .when("/", { templateUrl: "home.html" })
      .when("/products", {
        templateUrl: "products.html",
        reloadOnSearch: false,
      })
      .when("/products/:id", { templateUrl: "product-detail.html" })
      .when("/deals", { templateUrl: "deals.html" })
      .when("/contact", { templateUrl: "contact.html" })
      .when("/cart", { templateUrl: "cart.html" })
      .when("/checkout", {
        templateUrl: "checkout.html",
        resolve: { auth: authOnly },
      })
      .when("/order-confirmation/:id", {
        templateUrl: "order-confirmation.html",
        resolve: { auth: authOnly },
      })
      .when("/invoice/:id", {
        templateUrl: "invoice.html",
        resolve: { auth: authOnly },
      })
      .when("/orders", {
        templateUrl: "orders.html",
        resolve: { auth: authOnly },
      })
      .when("/wishlist", {
        templateUrl: "wishlist.html",
        resolve: { auth: authOnly },
      })
      .when("/profile", {
        templateUrl: "profile.html",
        resolve: { auth: authOnly },
      })
      .when("/login", { templateUrl: "login.html" })
      .when("/signup", { templateUrl: "signup.html" })
      .when("/admin", {
        templateUrl: "admin.html",
        resolve: { admin: adminOnly },
      })
      .otherwise({ redirectTo: "/" });
  })
  .factory("Api", function ($http, $window) {
    var api = {};
    api.token = function () {
      return $window.localStorage.getItem("zmart_token");
    };
    api.setToken = function (t) {
      t
        ? $window.localStorage.setItem("zmart_token", t)
        : $window.localStorage.removeItem("zmart_token");
    };
    api.request = function (method, url, data, config) {
      config = config || {};
      config.headers = config.headers || {};
      if (api.token()) config.headers.Authorization = "Bearer " + api.token();
      return $http(
        angular.extend(config, { method: method, url: url, data: data }),
      ).then(function (r) {
        return r.data;
      });
    };
    return api;
  })
  .service("AuthService", function (Api, $window) {
    var svc = this;
    svc.user = angular.fromJson(
      $window.localStorage.getItem("zmart_user") || "null",
    );
    svc.currentUser = function () {
      return svc.user;
    };
    svc.isLoggedIn = function () {
      return !!svc.user;
    };
    svc.save = function (token, user) {
      Api.setToken(token);
      svc.user = user;
      $window.localStorage.setItem("zmart_user", angular.toJson(user));
    };
    svc.signup = function (form) {
      return Api.request("POST", "/api/auth/signup", form).then(function (d) {
        svc.save(d.token, d.user);
        return d.user;
      });
    };
    svc.login = function (form) {
      return Api.request("POST", "/api/auth/login", form).then(function (d) {
        svc.save(d.token, d.user);
        return d.user;
      });
    };
    svc.logout = function () {
      Api.setToken(null);
      svc.user = null;
      $window.localStorage.removeItem("zmart_user");
    };
    svc.loadProfile = function () {
      return Api.request("GET", "/api/profile").then(function (d) {
        svc.user = d.user;
        $window.localStorage.setItem("zmart_user", angular.toJson(d.user));
        return d.user;
      });
    };
    svc.updateProfile = function (user) {
      return Api.request("PUT", "/api/profile", user).then(function (d) {
        svc.user = d.user;
        $window.localStorage.setItem("zmart_user", angular.toJson(d.user));
        return d.user;
      });
    };
  })
  .service("ProductService", function (Api) {
    var svc = this;
    svc.products = [];
    svc.categories = [];
    svc.brands = [];
    svc.query = function (params) {
      return Api.request("GET", "/api/products", null, { params: params }).then(
        function (d) {
          svc.products = d.products;
          svc.categories = ["All"].concat(d.categories);
          svc.brands = ["All"].concat(d.brands);
          return d;
        },
      );
    };
    svc.get = function (id) {
      return Api.request("GET", "/api/products/" + id).then(function (d) {
        return d.product;
      });
    };
    svc.discount = function (p) {
      return Math.round((1 - p.price / p.originalPrice) * 100);
    };
    svc.stars = function (rating) {
      var out = "";
      for (var i = 1; i <= 5; i++)
        out += i <= Math.round(rating || 0) ? "★" : "☆";
      return out;
    };
  })
  .service("CartService", function (Api, AuthService, $q) {
    var svc = this;
    svc.cart = [];
    svc.error = "";
    function mapItems(items) {
      return items.map(function (i) {
        return angular.extend({}, i.product, {
          productId: i.productId,
          quantity: i.quantity,
        });
      });
    }
    svc.load = function () {
      if (!AuthService.isLoggedIn()) {
        svc.cart.splice(0);
        return $q.when([]);
      }
      return Api.request("GET", "/api/cart").then(function (d) {
        svc.cart.splice(0, svc.cart.length);
        Array.prototype.push.apply(svc.cart, mapItems(d.items));
        return svc.cart;
      });
    };
    svc.add = function (product, qty) {
      if (!AuthService.isLoggedIn())
        return $q.reject({
          data: { error: "Please login to add items to cart." },
        });
      return Api.request("POST", "/api/cart/items", {
        productId: product.id || product.productId,
        quantity: qty,
      }).then(svc.load);
    };
    svc.remove = function (item) {
      return Api.request(
        "DELETE",
        "/api/cart/items/" + (item.productId || item.id),
      ).then(svc.load);
    };
    svc.increaseQty = function (item) {
      return svc.add(item, item.quantity + 1);
    };
    svc.decreaseQty = function (item) {
      return item.quantity > 1
        ? svc.add(item, item.quantity - 1)
        : svc.remove(item);
    };
    svc.getTotal = function () {
      return svc.cart.reduce(function (t, i) {
        return t + i.price * i.quantity;
      }, 0);
    };
    svc.clearLocal = function () {
      svc.cart.splice(0, svc.cart.length);
    };
  })
  .service("CheckoutService", function (Api) {
    this.validateCoupon = function (code) {
      return Api.request("POST", "/api/coupons/validate", { code: code });
    };
    this.createOrder = function (payload) {
      return Api.request("POST", "/api/orders", payload);
    };
    this.createRazorpayOrder = function (payload) {
      return Api.request("POST", "/api/payments/razorpay-order", payload);
    };
    this.verifyRazorpay = function (payload) {
      return Api.request("POST", "/api/payments/verify", payload);
    };
    this.orders = function () {
      return Api.request("GET", "/api/orders");
    };
    this.invoice = function (id) {
      return Api.request("GET", "/api/orders/" + id + "/invoice");
    };
  })
  .service("WishlistService", function (Api) {
    this.list = function () {
      return Api.request("GET", "/api/wishlist");
    };
    this.add = function (id) {
      return Api.request("POST", "/api/wishlist", { productId: id });
    };
    this.remove = function (id) {
      return Api.request("DELETE", "/api/wishlist/" + id);
    };
  })
  .service("ContactService", function (Api) {
    this.saveMessage = function (message) {
      return Api.request("POST", "/api/contact", message);
    };
  })
  .service("AdminService", function (Api) {
    this.products = function () {
      return Api.request("GET", "/api/products");
    };
    this.createProduct = function (p) {
      return Api.request("POST", "/api/admin/products", p);
    };
    this.updateProduct = function (p) {
      return Api.request("PUT", "/api/admin/products/" + p.id, p);
    };
    this.deleteProduct = function (p) {
      return Api.request("DELETE", "/api/admin/products/" + p.id);
    };
    this.orders = function () {
      return Api.request("GET", "/api/admin/orders");
    };
    this.messages = function () {
      return Api.request("GET", "/api/admin/messages");
    };
  })
  .controller(
    "NavbarController",
    function (
      $location,
      $scope,
      $window,
      AuthService,
      CartService,
      ProductService,
      WishlistService,
      Api,
    ) {
      var vm = this;
      vm.links = [
        { text: "Home", href: "#!/" },
        { text: "Products", href: "#!/products" },
        { text: "Deals", href: "#!/deals" },
        { text: "Contact", href: "#!/contact" },
        { text: "Wishlist", href: "#!/wishlist" },
        { text: "Cart", href: "#!/cart" },
      ];
      vm.cart = CartService.cart;
      vm.globalSearch = $location.search().q || "";
      vm.menuOpen = false;
      vm.suggestions = [];
      vm.cartError = "";
      vm.config = { razorpayKeyId: "", upiId: "zmart@okaxis" };
      Api.request("GET", "/api/config").then(function (c) {
        vm.config = c;
      });
      vm.user = function () {
        return AuthService.currentUser();
      };
      vm.logout = function () {
        AuthService.logout();
        CartService.clearLocal();
        $location.path("/");
      };
      vm.isActive = function (href) {
        return $window.location.hash === href;
      };
      vm.addToCart = function (product, qty) {
        vm.cartError = "";
        CartService.add(product, qty).catch(function (e) {
          vm.cartError = (e.data && e.data.error) || "Could not add to cart.";
          if (!AuthService.isLoggedIn()) $location.path("/login");
        });
      };
      vm.removeFromCart = function (item) {
        CartService.remove(item);
      };
      vm.increaseQty = function (item) {
        CartService.increaseQty(item).catch(function (e) {
          vm.cartError = (e.data && e.data.error) || "Stock limit reached.";
        });
      };
      vm.decreaseQty = function (item) {
        CartService.decreaseQty(item);
      };
      vm.getTotal = function () {
        return CartService.getTotal();
      };
      vm.getDiscount = function () {
        var s = vm.getTotal();
        return s >= 10000
          ? Math.round(s * 0.1)
          : s >= 5000
            ? Math.round(s * 0.05)
            : 0;
      };
      vm.getDeliveryCharge = function () {
        return vm.getTotal() >= 999 ? 0 : 49;
      };
      vm.getPayableTotal = function () {
        return vm.getTotal() - vm.getDiscount() + vm.getDeliveryCharge();
      };
      vm.getItemTotal = function (item) {
        return item.price * item.quantity;
      };
      vm.getCartItem = function (product) {
        return (
          CartService.cart.find(function (i) {
            return (i.productId || i.id) === product.id;
          }) || null
        );
      };
      vm.goSearch = function (q) {
        var query = (q || vm.globalSearch || "").trim();
        $location.path("/products").search("q", query || null);
        vm.suggestions = [];
        vm.menuOpen = false;
      };
      vm.syncSearch = function () {
        var q = (vm.globalSearch || "").trim();
        if (q.length < 2) {
          vm.suggestions = [];
          return;
        }
        ProductService.query({ q: q }).then(function (d) {
          vm.suggestions = d.products.slice(0, 5);
        });
        if ($location.path() === "/products") $location.search("q", q || null);
      };
      vm.toggleWishlist = function (product) {
        if (!AuthService.isLoggedIn()) return $location.path("/login");
        WishlistService.add(product.id);
      };
      $scope.$on("$routeChangeSuccess", function () {
        vm.globalSearch = $location.search().q || "";
        vm.menuOpen = false;
        CartService.load();
      });
    },
  )
  .controller("AuthController", function ($location, AuthService) {
    var vm = this;
    vm.form = {};
    vm.error = "";
    vm.login = function (form) {
      if (form.$invalid) return form.$setSubmitted();
      vm.error = "";
      AuthService.login(vm.form)
        .then(function () {
          $location.path($location.search().next || "/");
        })
        .catch(function (e) {
          vm.error = (e.data && e.data.error) || "Login failed.";
        });
    };
    vm.signup = function (form) {
      if (form.$invalid) return form.$setSubmitted();
      vm.error = "";
      AuthService.signup(vm.form)
        .then(function () {
          $location.path("/profile");
        })
        .catch(function (e) {
          vm.error = (e.data && e.data.error) || "Signup failed.";
        });
    };
  })
  .controller("HomeController", function (ProductService) {
    var vm = this;
    vm.featured = [];
    vm.discount = ProductService.discount;
    vm.stars = ProductService.stars;
    ProductService.query().then(function (d) {
      vm.featured = d.products.slice(0, 4);
    });
  })
  .controller(
    "ProductsController",
    function ($location, $scope, ProductService) {
      var vm = this;
      vm.products = [];
      vm.searchText = $location.search().q || "";
      vm.selectedCat = "All";
      vm.selectedBrand = "All";
      vm.minPrice = "";
      vm.maxPrice = "";
      vm.minRating = "";
      vm.stock = "";
      vm.sortBy = "default";
      vm.categories = ["All"];
      vm.brands = ["All"];
      vm.discount = ProductService.discount;
      vm.stars = ProductService.stars;
      vm.load = function () {
        ProductService.query({
          q: vm.searchText,
          category: vm.selectedCat,
          brand: vm.selectedBrand,
          minPrice: vm.minPrice,
          maxPrice: vm.maxPrice,
          rating: vm.minRating,
          stock: vm.stock,
        }).then(function (d) {
          vm.products = d.products;
          vm.categories = d.categories;
          vm.brands = d.brands;
        });
      };
      vm.filterCat = function (cat) {
        vm.selectedCat = cat;
        vm.load();
      };
      vm.filteredProducts = function () {
        var list = vm.products.slice();
        if (vm.sortBy === "priceLow")
          list.sort(function (a, b) {
            return a.price - b.price;
          });
        if (vm.sortBy === "priceHigh")
          list.sort(function (a, b) {
            return b.price - a.price;
          });
        if (vm.sortBy === "rating")
          list.sort(function (a, b) {
            return b.rating - a.rating;
          });
        return list;
      };
      $scope.$on("$routeUpdate", function () {
        vm.searchText = $location.search().q || "";
        vm.load();
      });
      vm.load();
    },
  )
  .controller(
    "ProductDetailController",
    function ($routeParams, ProductService, Api) {
      var vm = this;
      vm.product = null;
      vm.qty = 1;
      vm.review = {};
      vm.error = "";
      vm.success = "";
      vm.discount = ProductService.discount;
      vm.stars = ProductService.stars;
      vm.load = function () {
        ProductService.get($routeParams.id).then(function (p) {
          vm.product = p;
        });
      };
      vm.stockLabel = function (p) {
        if (!p || p.stock <= 0) return "Out of stock";
        if (p.stock <= 5) return "Only " + p.stock + " left";
        return "In stock";
      };
      vm.submitReview = function (form) {
        if (form.$invalid) return form.$setSubmitted();
        Api.request("POST", "/api/reviews", {
          productId: vm.product.id,
          rating: vm.review.rating,
          text: vm.review.text,
        })
          .then(function () {
            vm.success = "Review saved.";
            vm.review = {};
            vm.load();
          })
          .catch(function (e) {
            vm.error = (e.data && e.data.error) || "Could not save review.";
          });
      };
      vm.load();
    },
  )
  .controller("ProfileController", function (AuthService) {
    var vm = this;
    vm.user = angular.copy(AuthService.currentUser());
    vm.saved = false;
    vm.error = "";
    vm.addAddress = function () {
      vm.user.addresses = vm.user.addresses || [];
      vm.user.addresses.push({
        label: "Home",
        line1: "",
        city: "",
        state: "",
        pincode: "",
        phone: vm.user.phone,
      });
    };
    vm.removeAddress = function (i) {
      vm.user.addresses.splice(i, 1);
    };
    vm.save = function () {
      AuthService.updateProfile(vm.user)
        .then(function (u) {
          vm.user = angular.copy(u);
          vm.saved = true;
        })
        .catch(function (e) {
          vm.error = (e.data && e.data.error) || "Could not save profile.";
        });
    };
  })
  .controller(
    "CheckoutController",
    function (
      $location,
      $window,
      AuthService,
      CartService,
      CheckoutService,
      Api,
    ) {
      var vm = this;
      vm.user = AuthService.currentUser();
      vm.cart = CartService.cart;
      vm.paymentMethods = [
        {
          id: "upi",
          title: "UPI QR / GPay",
          detail: "Scan and place as pending verification",
        },
        {
          id: "razorpay",
          title: "Razorpay Online",
          detail: "Card, net banking, wallet, UPI",
        },
        {
          id: "cod",
          title: "Cash on Delivery",
          detail: "Pay when your order arrives",
        },
      ];
      vm.paymentMethod = "cod";
      vm.addressId = vm.user.addresses[0] && vm.user.addresses[0].id;
      vm.couponCode = "";
      vm.summary = null;
      vm.error = "";
      vm.upiReference = "";
      vm.config = { upiId: "zmart@okaxis" };
      Api.request("GET", "/api/config").then(function (c) {
        vm.config = c;
      });
      CartService.load();
      vm.applyCoupon = function () {
        CheckoutService.validateCoupon(vm.couponCode)
          .then(function (t) {
            vm.summary = t;
            vm.error = "";
          })
          .catch(function (e) {
            vm.error = (e.data && e.data.error) || "Invalid coupon.";
          });
      };
      vm.placeOrder = function () {
        vm.error = "";
        var payload = {
          addressId: vm.addressId,
          paymentMethod: vm.paymentMethod,
          couponCode: vm.couponCode,
          upiReference: vm.upiReference,
        };
        if (!vm.addressId) {
          vm.error = "Please select a delivery address.";
          return;
        }
        if (vm.paymentMethod === "razorpay")
          return CheckoutService.createRazorpayOrder(payload)
            .then(function (po) {
              if (!$window.Razorpay)
                throw { data: { error: "Razorpay Checkout could not load." } };
              new $window.Razorpay({
                key: po.keyId,
                amount: po.amount,
                currency: po.currency,
                name: "ZMart",
                order_id: po.orderId,
                prefill: {
                  name: vm.user.name,
                  email: vm.user.email,
                  contact: vm.user.phone,
                },
                theme: { color: "#ff6b35" },
                handler: function (resp) {
                  CheckoutService.verifyRazorpay(
                    angular.extend({}, payload, resp),
                  ).then(function (d) {
                    CartService.clearLocal();
                    $location.path("/order-confirmation/" + d.order.id);
                  });
                },
              }).open();
            })
            .catch(function (e) {
              vm.error = (e.data && e.data.error) || "Payment failed.";
            });
        CheckoutService.createOrder(payload)
          .then(function (d) {
            CartService.clearLocal();
            $location.path("/order-confirmation/" + d.order.id);
          })
          .catch(function (e) {
            vm.error = (e.data && e.data.error) || "Order failed.";
          });
      };
      vm.getUpiUrl = function () {
        var amount = (vm.summary ? vm.summary.total : 0).toFixed(2);
        return (
          "upi://pay?pa=" +
          encodeURIComponent(vm.config.upiId) +
          "&pn=ZMart&am=" +
          amount +
          "&cu=INR&tn=ZMart%20order"
        );
      };
      vm.getUpiQrUrl = function () {
        return (
          "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
          encodeURIComponent(vm.getUpiUrl())
        );
      };
      vm.applyCoupon();
    },
  )
  .controller("OrdersController", function (CheckoutService) {
    var vm = this;
    vm.orders = [];
    CheckoutService.orders().then(function (d) {
      vm.orders = d.orders;
    });
  })
  .controller("InvoiceController", function ($routeParams, CheckoutService) {
    var vm = this;
    vm.order = null;
    CheckoutService.invoice($routeParams.id).then(function (d) {
      vm.order = d.order;
    });
  })
  .controller("WishlistController", function (WishlistService, CartService) {
    var vm = this;
    vm.products = [];
    vm.load = function () {
      WishlistService.list().then(function (d) {
        vm.products = d.products;
      });
    };
    vm.moveToCart = function (p) {
      CartService.add(p, 1)
        .then(function () {
          return WishlistService.remove(p.id);
        })
        .then(vm.load);
    };
    vm.remove = function (p) {
      WishlistService.remove(p.id).then(vm.load);
    };
    vm.load();
  })
  .controller("ContactController", function (ContactService) {
    var vm = this;
    vm.form = {};
    vm.submitted = false;
    vm.error = "";
    vm.send = function (form) {
      vm.submitted = false;
      vm.error = "";
      if (form.$invalid) {
        form.$setSubmitted();
        return;
      }
      ContactService.saveMessage(vm.form)
        .then(function () {
          vm.submitted = true;
          vm.form = {};
          form.$setPristine();
          form.$setUntouched();
        })
        .catch(function (e) {
          vm.error = (e.data && e.data.error) || "Could not send message.";
        });
    };
  })
  .controller("AdminController", function (AdminService) {
    var vm = this;
    vm.products = [];
    vm.orders = [];
    vm.messages = [];
    vm.tab = "products";
    vm.editing = null;
    vm.product = {};
    vm.notice = "";
    vm.error = "";
    vm.load = function () {
      AdminService.products().then(function (d) {
        vm.products = d.products;
      });
      AdminService.orders().then(function (d) {
        vm.orders = d.orders;
      });
      AdminService.messages().then(function (d) {
        vm.messages = d.messages;
      });
    };
    vm.edit = function (p) {
      vm.notice = "";
      vm.error = "";
      vm.editing = p.id;
      vm.product = angular.copy(p);
    };
    vm.cancel = function () {
      vm.editing = null;
      vm.product = {};
    };
    vm.save = function () {
      vm.notice = "";
      vm.error = "";
      vm.product.stock = Math.max(0, Number(vm.product.stock || 0));
      vm.product.price = Math.max(0, Number(vm.product.price || 0));
      vm.product.originalPrice = Math.max(
        0,
        Number(vm.product.originalPrice || vm.product.price || 0),
      );
      var op = vm.editing
        ? AdminService.updateProduct(vm.product)
        : AdminService.createProduct(vm.product);
      op.then(function () {
        vm.notice = vm.editing
          ? "Product updated. Stock is now " + vm.product.stock + "."
          : "Product added.";
        vm.cancel();
        vm.load();
      }).catch(function (e) {
        vm.error = (e.data && e.data.error) || "Could not save product.";
      });
    };
    vm.delete = function (p) {
      vm.notice = "";
      vm.error = "";
      AdminService.deleteProduct(p)
        .then(function () {
          vm.notice = "Product deleted.";
          vm.load();
        })
        .catch(function (e) {
          vm.error = (e.data && e.data.error) || "Could not delete product.";
        });
    };
    vm.load();
  });
