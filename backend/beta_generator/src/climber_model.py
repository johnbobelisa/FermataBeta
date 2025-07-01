class ClimberModel:
    """Defines the anthropometric data for a climber."""

    def __init__(self):
        # Segment lengths as fractions of total height (unitless)
        self.upper_arm_length = 0.15
        self.forearm_length = 0.15
        self.thigh_length = 0.25
        self.shin_length = 0.20

        self.torso_width = 0.15
        self.torso_height = 0.25

    def scale_to_image(self, image_height: float, real_climber_height_m: float = 1.7) -> None:
        """
        Scale segment lengths based on a real human height and the image height.

        Example: if real climber is 1.8 meters tall and the image is 1000px tall,
        then 1 meter ≈ 1000 / 1.8 ≈ 555.56 pixels.
        """
        meters_to_pixels = image_height / real_climber_height_m

        self.upper_arm_length *= meters_to_pixels
        self.forearm_length *= meters_to_pixels
        self.thigh_length *= meters_to_pixels
        self.shin_length *= meters_to_pixels
        self.torso_width *= meters_to_pixels
        self.torso_height *= meters_to_pixels
