import sys, subprocess, os, json

input_path = sys.argv[1]
output_path = sys.argv[2]
res = sys.argv[3] if len(sys.argv) > 3 else 'full'

if not os.path.exists(input_path):
    sys.exit(1)

ffmpeg = os.path.join(os.path.dirname(__file__), '.venv', 'lib',
                      'python3.14', 'site-packages', 'imageio_ffmpeg',
                      'binaries', 'ffmpeg-linux-x86_64-v7.0.2')

base_cmd = [ffmpeg, '-y', '-i', input_path,
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-preset', 'ultrafast', '-movflags', '+faststart']

if res == 'youtube':
    vf = 'crop=iw:ih*0.9:0:ih*0.05'
elif res == 'instagram':
    vf = 'crop=iw*0.35:ih:iw*0.325:0'
else:
    vf = None

if vf:
    base_cmd += ['-vf', vf]

base_cmd.append(output_path)

subprocess.run(base_cmd, capture_output=True, timeout=120)
