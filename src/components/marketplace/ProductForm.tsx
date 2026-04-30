/**
 * ProductForm Component
 * Form for creating and editing marketplace products
 */

import { useState, useEffect } from "react";
import { useProductMutations } from "@/hooks/useMarketplace";
import { Product } from "@/services/marketplace.service";
import { useGeolocation } from "@/hooks/useGeolocation";

interface ProductFormProps {
  product?: Product;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Sports",
  "Home & Garden",
  "Toys",
  "Vehicles",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product;
  const { createProduct, updateProduct } = useProductMutations();
  const {
    location: userLocation,
    isLoading: locationLoading,
    error: locationError,
    getCurrentLocation,
  } = useGeolocation();

  // Auto-request the user's location on mount (required to create a listing).
  useEffect(() => {
    if (!isEditing && !userLocation && !locationLoading) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [category, setCategory] = useState(product?.category || "");
  const [condition, setCondition] = useState(product?.condition || "good");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images || []);
  const [negotiable, setNegotiable] = useState(product?.negotiable ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length < 3 || title.length > 100) {
      newErrors.title = "Title must be between 3 and 100 characters";
    }

    if (!description.trim() || description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!price || parseFloat(price) < 0) {
      newErrors.price = "Price must be a positive number";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (!isEditing && images.length === 0 && imageUrls.length === 0) {
      newErrors.images = "At least one image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length + imageUrls.length + images.length > 5) {
      setErrors({ ...errors, images: "Maximum 5 images allowed" });
      return;
    }

    setImages([...images, ...validImages]);
    setErrors({ ...errors, images: "" });
  };

  const handleRemoveImage = (index: number, isUrl: boolean) => {
    if (isUrl) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    } else {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // For new listings we need a real location. Reject (0,0) and missing coords.
    const existingLoc = product?.location;
    const hasValidExistingLoc =
      !!existingLoc &&
      typeof existingLoc.latitude === "number" &&
      typeof existingLoc.longitude === "number" &&
      !(existingLoc.latitude === 0 && existingLoc.longitude === 0);

    const hasValidUserLoc =
      !!userLocation &&
      typeof userLocation.latitude === "number" &&
      typeof userLocation.longitude === "number" &&
      !(userLocation.latitude === 0 && userLocation.longitude === 0);

    if (!hasValidExistingLoc && !hasValidUserLoc) {
      setErrors((prev) => ({
        ...prev,
        location:
          locationError ||
          "Location is required. Please allow location access and try again.",
      }));
      return;
    }

    const location = hasValidExistingLoc
      ? existingLoc!
      : {
          latitude: userLocation!.latitude,
          longitude: userLocation!.longitude,
          address: (userLocation as any)!.formattedAddress || (userLocation as any)!.address,
        };

    try {
      if (isEditing) {
        const result = await updateProduct.mutateAsync({
          productId: product.id,
          data: {
            title: title.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category,
            condition: condition as any,
            images: imageUrls,
            location,
          },
        });
        const productData = (result as any).data || result;
        onSuccess?.(productData);
      } else {
        const result = await createProduct.mutateAsync({
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category,
          condition: condition as any,
          images: images.length > 0 ? images : imageUrls,
          location,
          negotiable,
        });
        const productData = (result as any).data || result;
        onSuccess?.(productData);
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEditing ? "Edit Product" : "Create Product Listing"}
        </h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., iPhone 15 Pro Max - Like New"
            maxLength={100}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{title.length}/100</p>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your product in detail..."
            rows={6}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description}</p>
          )}
        </div>

        {/* Price and Category Row */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Price (₦) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-400">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-400">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Condition */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Condition
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => setCondition(cond.value as typeof condition)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  condition === cond.value
                    ? "bg-green-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Images <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
            id="product-images"
          />
          <label
            htmlFor="product-images"
            className="block w-full px-4 py-8 border-2 border-dashed border-gray-700 rounded-lg text-center text-gray-400 hover:border-green-500 hover:text-green-400 cursor-pointer transition-colors"
          >
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Click to upload images (max 5)
          </label>
          {errors.images && (
            <p className="mt-1 text-sm text-red-400">{errors.images}</p>
          )}

          {/* Image Previews */}
          {(images.length > 0 || imageUrls.length > 0) && (
            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
              {imageUrls.map((url, idx) => (
                <div key={`url-${idx}`} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx, true)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.map((file, idx) => (
                <div key={`file-${idx}`} className="relative aspect-square">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx, false)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Negotiable */}
        {!isEditing && (
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500"
              />
              <span className="text-sm text-gray-300">Price is negotiable</span>
            </label>
          </div>
        )}

        {/* Location status (required for new listings) */}
        {!isEditing && (
          <div className="mb-6">
            {locationLoading && (
              <p className="text-sm text-gray-400">
                Detecting your location…
              </p>
            )}
            {!locationLoading && userLocation &&
              !(userLocation.latitude === 0 && userLocation.longitude === 0) && (
                <p className="text-sm text-green-400">
                  Location set{(userLocation as any).formattedAddress ? `: ${(userLocation as any).formattedAddress}` : (userLocation as any).address ? `: ${(userLocation as any).address}` : ""}
                </p>
              )}
            {!locationLoading && (!userLocation ||
              (userLocation.latitude === 0 && userLocation.longitude === 0)) && (
              <div className="flex items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
                <p className="text-sm text-red-300">
                  {locationError ||
                    "Location is required to create a listing."}
                </p>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md"
                >
                  Enable
                </button>
              </div>
            )}
            {errors.location && (
              <p className="text-sm text-red-400 mt-2">{errors.location}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || (!isEditing && locationLoading)}
            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isPending
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Product"
              : "Create Listing"}
          </button>
        </div>
      </div>
    </form>
  );
}
