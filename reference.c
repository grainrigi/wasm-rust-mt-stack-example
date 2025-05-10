#include <stdio.h>

int main(void) {
  int work[1024];
  long long int sum = 0;

  for (int i = 0; i < 1024; i++) {
    work[i] = i;
  }

  for (int b = 0; b < 100000; b++) {
    for (int i = 0; i < 1024; i++) {
      sum += work[i];
    }
    for (int i = 0; i < 1024; i++) {
      work[i] = work[i] + 1;
    }
  }

  printf("%lld\n", sum);
}