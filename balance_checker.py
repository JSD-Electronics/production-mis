import re

with open('c:/production-mis/src/components/Operators/viewTask/DeviceTestComponent.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    line_num = i + 1
    # Count opens and closes in this line
    # Note: this is a bit crude as it doesn't handle multi-line tags well, but usually <div and </div are on their own or start/end lines
    for m in re.finditer(r'<div', line):
        stack.append((line_num, line.strip()))
    for m in re.finditer(r'</div', line):
        if stack:
            stack.pop()
        else:
            print(f"Unexpected </div> at line {line_num}: {line.strip()}")

if stack:
    print("\nUnclosed <div tags:")
    for ln, content in stack:
        print(f"  Line {ln}: {content}")
else:
    print("\nAll <div> tags balanced.")

# Also check Parens/Braces imbalance in JSX
content = "".join(lines)
def check_imbalance(char_open, char_close, name):
    count = 0
    for i, c in enumerate(content):
        if c == char_open: count += 1
        if c == char_close: count -= 1
        if count < 0:
            print(f"Unexpected '{char_close}' around line {content.count('\n', 0, i) + 1}")
            count = 0
    if count > 0:
        print(f"Unclosed '{char_open}' (count: {count})")

check_imbalance('{', '}', "Braces")
check_imbalance('(', ')', "Parens")
