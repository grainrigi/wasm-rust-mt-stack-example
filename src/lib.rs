#[no_mangle]
pub extern "C" fn algorithm() -> i64 {
    let mut work = [0 as i32; 1024];
    let mut sum: i64 = 0;

    for i in 0..1024 {
        work[i] = i as i32;
    }

    for _ in 0..100000 {
        for i in 0..1024 {
            sum += work[i] as i64;
        }
        for i in 0..1024 {
            work[i] = work[i] + 1;
        }
    }

    sum
}