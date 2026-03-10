"use client";

export const toDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};

export const toTimeString = (date: Date) => date.toTimeString().slice(0, 5);

export const calculateWorkingHours = (startTime: string, endTime: string, breakMinutes: number) => {
    if (!startTime || !endTime || breakMinutes == null) return 0;

    const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const totalMinutes = end - start - Number(breakMinutes);

    if (isNaN(totalMinutes) || totalMinutes <= 0) return 0;

    return Math.floor(totalMinutes / 60);
};

export const transformIntervals = (shift: any) => {
    const rawIntervals = shift?.intervals || [];
    const intervals: any[] = [];

    rawIntervals.forEach((interval: any) => {
        if (interval.breakTime) {
            intervals.push(interval);
        } else {
            let curr = toDate(interval.startTime);
            const end = toDate(interval.endTime);
            while (curr < end) {
                let next = new Date(curr);
                next.setHours(curr.getHours() + 1);
                if (next > end) next = new Date(end);

                intervals.push({
                    startTime: toTimeString(curr),
                    endTime: toTimeString(next),
                    breakTime: false,
                });
                curr = next;
            }
        }
    });

    return intervals;
};
