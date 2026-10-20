import sys
import subprocess
from PIL import Image, ImageDraw

img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

line_width = 24

# We define the coordinates scaled from the 24x24 viewBox to 256x256.
# Path 1: M12 2 L2 7 l10 5 l10-5 l-10-5z
# Shift X by +8 to center (12 * 10 = 120 + 8 = 128)
p1 = [(128, 20), (28, 70), (128, 120), (228, 70), (128, 20)]

# Path 2: M2 12 l10 5 l10-5 (Middle lines)
p2 = [(28, 120), (128, 170), (228, 120)]

# Path 3: M2 17 l10 5 l10-5 (Bottom lines)
p3 = [(28, 170), (128, 220), (228, 170)]

# The SVG uses a gradient from #6366f1 to #8b5cf6. 
# We'll use intermediate colors for the different paths to simulate the gradient.
color_top = (99, 102, 241, 255)      # #6366f1
color_mid = (119, 97, 243, 255)
color_bot = (139, 92, 246, 255)      # #8b5cf6

draw.line(p1, fill=color_top, width=line_width, joint="curve")
draw.line(p2, fill=color_mid, width=line_width, joint="curve")
draw.line(p3, fill=color_bot, width=line_width, joint="curve")

# We'll save it over the default Next.js favicon
img.save('../src/app/favicon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])

print("Favicon successfully generated and updated as an outline logo!")
