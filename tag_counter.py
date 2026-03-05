import re

with open('c:/production-mis/src/components/Operators/viewTask/DeviceTestComponent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

opens = [m.start() for m in re.finditer(r'<div', content)]
closes = [m.start() for m in re.finditer(r'</div', content)]

print(f"Total <div: {len(opens)}")
print(f"Total </div: {len(closes)}")

# Simple stack trace for divs
stack = []
lines = content.split('\n')
for i, line in enumerate(lines):
    for m in re.finditer(r'<div', line):
        stack.append(i+1)
    for m in re.finditer(r'</div', line):
        if stack:
            stack.pop()
        else:
            print(f"Unexpected </div> at line {i+1}")

if stack:
    print(f"Unclosed <div started at lines: {stack}")
