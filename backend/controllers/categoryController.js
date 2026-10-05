const Category = require("../models/Category");
const { createSlug } = require("../utils/slugify");

// GET /api/categories (supports all=true for admin view)
async function getCategories(req, res, next) {
  try {
    const { all } = req.query;
    const filter = all === "true" ? {} : { isActive: true };

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .populate("parent", "name slug")
      .lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories
async function createCategory(req, res, next) {
  try {
    const { name, description, parent, sortOrder = 0, isActive = true } = req.body;

    if (!name || !name.trim()) {
      const err = new Error("Category name is required");
      err.statusCode = 400;
      throw err;
    }

    const slug = createSlug(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      const err = new Error(`Category '${name}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    const category = new Category({
      name: name.trim(),
      slug,
      description: description ? description.trim() : "",
      parent: parent || null,
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder),
    });

    await category.save();
    const populated = await Category.findById(category._id).populate("parent", "name slug");

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: populated,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, parent, sortOrder, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }

    if (name && name.trim()) {
      category.name = name.trim();
      category.slug = createSlug(name);
    }
    if (description !== undefined) category.description = description;
    if (parent !== undefined) category.parent = parent || null;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();
    const populated = await Category.findById(category._id).populate("parent", "name slug");

    res.json({
      success: true,
      message: "Category updated successfully",
      data: populated,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }

    // Check if subcategories exist under this category
    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      const err = new Error("Cannot delete category with subcategories. Remove or reassign subcategories first.");
      err.statusCode = 400;
      throw err;
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

