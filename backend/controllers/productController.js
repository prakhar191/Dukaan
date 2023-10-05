const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary").v2;

//CREATE PRODUCT--ADMIN
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  if (req.body.images.length === 0) {
    return next(new ErrorHandler("Upload Images Properly", 404));
  }

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.uploader.upload(images[i], {
      folder: "productImages",
      width: 300,
      crop: "scale",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  // req.body.user=req.user.id;

  const { name, description, price, category, Stock } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    Stock,
    images: imagesLinks,
    user: req.user.id,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

//CREATE CATEGORY
exports.createCategory = catchAsyncErrors(async (req, res) => {
  const { categoryName } = req.body;

  const category = await Category.findOne({ categoryName });
  if (category) return next(new ErrorHandler("Category already exists"));

  const myCloud = await cloudinary.uploader.upload(req.body.photoCategory, {
    folder: "category",
    width: 300,
    crop: "scale",
  });

  await Category.create({
    categoryName,
    photoCategory: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  res.status(200).json({
    success: true,
    message: "Category created",
  });
});

//GET ALL CATEGORY
exports.getAllCategory = catchAsyncErrors(async (req, res, next) => {
  const category = await Category.find();

  res.status(200).json({
    success: true,
    category,
  });
});

//GET ALL PRODUCTS
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  let products = await apiFeature.query;

  // console.log(products);

  let productsCount = products.length;
  // const pages = Math.ceil(productsCount / resultPerPage);
  const pages = productsCount;

  // const apiFeature2 = new ApiFeatures(Product.find(), req.query)
  // .search()
  //   .filter()
  // .pagination(
  //   resultPerPage
  // );

  // products = await apiFeature2.query;
  let sortedItems = products.sort((p1, p2) => {
    if (p1.numOFReviews !== p2.numOFReviews) {
      return p1.numOFReviews < p2.numOFReviews
        ? 1
        : p1.numOFReviews > p2.numOFReviews
        ? -1
        : 0;
    } else if (p1.rating !== p2.rating) {
      return p1.rating < p2.rating ? 1 : p1.rating > p2.rating ? -1 : 0;
    } else {
      return p1.numberOfViews < p2.numberOfViews
        ? 1
        : p1.numberOfViews > p2.numberOfViews
        ? -1
        : 0;
    }
  });

  products = sortedItems;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    pages,
  });
});

//GET ALL PRODUCTS --ADMIN
exports.getAdminProducts = catchAsyncErrors(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
  });
});

//GET PRODUCT DETAILS
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  var views = product.numberOfViews;
  views = views + 1;
  product.numberOfViews = views;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    product,
  });
});

//UPDATE PRODUCTS -- ADMIN
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  //Images Updating
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    //Deleting Images from cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    userFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

//DELETE PRODUCT --ADMIN
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.uploader.destroy(product.images[i].public_id);
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

//CREATE NEW REVIEW/UPDATE REVIEW
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOFReviews = product.reviews.length;
  }

  let avg = 0;
  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });
  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

//GET ALL REVIEWS OF A PRODUCT
exports.getProductReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 400));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

//DELETE REVIEW
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 400));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length !== 0) {
    ratings = avg / reviews.length;
  }

  const numOFReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOFReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
