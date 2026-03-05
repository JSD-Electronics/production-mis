import re

with open('c:/production-mis/src/components/Operators/viewTask/DeviceTestComponent.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content_range = lines[1722:3245] # Lines 1723 to 3245
content = "".join(content_range)

opens = [m.start() for m in re.finditer(r'<div', content)]
closes = [m.start() for m in re.finditer(r'</div', content)]

print(f"Range 1723-3245: opens={len(opens)}, closes={len(closes)}")

stack = []
for i, line in enumerate(content_range):
    line_num = i + 1723
    for m in re.finditer(r'<div', line):
        stack.append(line_num)
    for m in re.finditer(r'</div', line):
        if stack:
            stack.pop()
        else:
            print(f"Unexpected </div> at line {line_num}")

if stack:
    print(f"Unclosed <div started at lines: {stack}")
