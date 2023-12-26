const cleanedTopImages = topImages.map(image => ({
    ...image.toObject(),
    name: image.name.replace(/^avatar-gen/, '').replace(/\.jpg$/, '')
}));