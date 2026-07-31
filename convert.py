import sys, subprocess, os

input_path = sys.argv[1]
output_path = sys.argv[2]

if not os.path.exists(input_path):
    sys.exit(1)

ffmpeg = os.path.join(os.path.dirname(__file__), '.venv', 'lib',
                      'python3.14', 'site-packages', 'imageio_ffmpeg',
                      'binaries', 'ffmpeg-linux-x86_64-v7.0.2')

subprocess.run([ffmpeg, '-y', '-i', input_path,
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-preset', 'ultrafast', '-movflags', '+faststart',
                output_path],
               capture_output=True, timeout=120)
