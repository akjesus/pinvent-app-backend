const express = require("express");
const {
  createProduct,
  getAllProducts,
  getOneProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const auth = require("../middlewares/authMiddleware");
const { upload } = require("../utils/fileUpload");
const productRouter = express.Router();

productRouter.post("/", auth, upload.single("image"), createProduct);
productRouter.get("/", auth, getAllProducts);
productRouter.get("/:id", auth, getOneProduct);
productRouter.patch("/:id", auth, upload.single("image"), updateProduct);
productRouter.delete("/:id", auth, deleteProduct);

module.exports = productRouter;
