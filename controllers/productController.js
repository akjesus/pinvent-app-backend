const asyncHandler = require("express-async-handler");
const { success, failure } = require("../utils/response");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const createProduct = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return failure(res, 401, "Unauthorized");
  const { name, sku, category, quantity, price, description } = req.body;
  if (!name || !sku || !category || !quantity || !price || !description) {
    return failure(res, 400, "Please provide all neccesary fields");
  }

  let fileData = {};
  if (req.file) {
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "PinventApp",
        resource_type: "image",
      });
    } catch (error) {
      return failure(res, 500, "Image could not be uploaded", error);
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
      filePublicId: uploadedFile.public_id,
    };
  }
  const newProduct = await Product.create({
    user: req.user._id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });
  return success(res, 201, "Product created Successfully", newProduct);
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  if (!products.length) {
    return failure(res, 404, "No product found");
  }
  return res.status(200).json(products);
});

const getOneProduct = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return failure(res, 400, "Invalid Product ID");
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return failure(res, 404, "No such product found!");
  }
  if (product.user.toString() !== req.user._id.toString()) {
    return failure(res, 403, "You are unauthorized to access this product");
  }
  return res.status(200).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return failure(res, 400, "Invalid Product ID");
  }
  const { name, category, quantity, price, description } = req.body;
  if (!req.body) {
    return failure(res, 400, "Please provide a body with the updated fields");
  }

  const product = await Product.findById(id);
  if (!product) {
    return failure(res, 404, "No such product found!");
  }
  let fileData = {};
  if (req.file) {
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "PinventApp",
        resource_type: "image",
      });

      //   await cloudinary.uploader.destroy(
      //     product.fileData.filePublicId,
      //     function (result) {
      //       console.log(result);
      //     }
      //   );
    } catch (error) {
      return failure(res, 500, "Image could not be uploaded", error);
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
      filePublicId: uploadedFile.public_id,
    };
  }
  if (product.user.toString() !== req.user._id.toString()) {
    return failure(res, 403, "You are unauthorized to update this product");
  }

  const updateProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    { new: true, runValidators: true }
  );
  return success(res, 200, `Successfuly updated product`, updateProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return failure(res, 400, "Invalid Product ID");
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return failure(res, 404, "No such product found!");
  }
  if (product.user.toString() !== req.user._id.toString()) {
    return failure(res, 403, "You are unauthorized to delete this product");
  }
  await product.deleteOne();
  return success(res, 200, "Successfully deleted the product", null);
});
module.exports = {
  createProduct,
  getAllProducts,
  getOneProduct,
  updateProduct,
  deleteProduct,
};
