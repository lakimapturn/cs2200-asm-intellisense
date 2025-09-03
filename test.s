!==================================================================================
! CS 2200 Homework 2 Part 2: Fibonacci Sequence
!
! Apart from initializing the stack, please do not edit main's functionality.
! You do not need to save the return address before jumping to fibonacci in main.
!==================================================================================

main:
    add     $zero, $zero, $zero     ! TODO: Here, you need to get the address of the stack
                                    ! using the provided label to initialize the stack pointer.
                                    ! load the label address into $sp and in the next instruction,
                                    ! use $sp as base register to load the value (0xFFFF) into $sp.

    lea     $sp, stack
    lw      $sp, 0($sp)

    lea     $at, fibonacci          ! loads address of fibonacci label into $at

    lea     $a0, testFibInput3      ! loads address of number into $a0
    lw      $a0, 0($a0)             ! loads value of number into $a0

    jalr    $at, $ra                ! jump to fibonacci, set $ra to return addr
    halt                            ! when we return, just halt

fibonacci: 
    add     $zero, $zero, $zero     ! TODO: perform post-call portion of the calling convention.
                                    ! Make sure to save any registers you will be using!

    ! store prev frame pointer, per calling convention
    addi    $sp, $sp, -1
    sw      $fp, 0($sp)
    add     $fp, $sp, $zero

    ! save s-registers (as necessary)
    ! in this solution, we save $s0 to the stack as it represents the prior
    ! caller's f(n - 1) value. when fibonacci calls f(n - 1), it wants to store
    ! that return value ($v0) onto the stack somehow. otherwise, it gets clobbered
    ! by f(n - 2). so the convention is add $v0 into $s0 and save $s0 on each
    ! invocation.
    addi    $sp, $sp, -1
    sw      $s0, 0($sp)

    add     $zero, $zero, $zero     ! TODO: Implement the following pseudocode in assembly:
                                    ! IF ($a0 == 0)
                                    !    GOTO base (just returns $a0)
                                    ! ELSE IF ($a0 == 1)
                                    !    GOTO base 
                                    ! ELSE:
                                    !    GOTO else (main recursive logic)

    beq     $a0, $zero, base        ! if $a0 == 0 goto base
    addi    $t0, $zero, 1
    beq     $a0, $t0, base          ! if $a0 == 1 goto base
                                    ! else:

else:
    add     $zero, $zero, $zero     ! TODO: perform recursion after decrementing
                                    ! the parameter by 1 (n - 1 step). Remember, 
                                    ! $a0 holds the parameter value. Then, 
                                    ! perform recursion for the second step after 
                                    ! decrementing the parameter by 1 again.
                                    ! Note that you can also just utilize $a1 for the
                                    ! second recursive step (as you wish).

    add     $zero, $zero, $zero     ! TODO: Implement the following pseudocode in assembly:
                                    ! $v0 = f(n - 1) + f(n - 2)
                                    ! RETURN $v0
                                    
    !  (now we're the caller and doing setup)

    ! the other complicated step to this solution is we want to store
    ! $a0 onto the stack. the reason being if we just greedily decrement it,
    ! when we return from the callee $a0 won't be the right value anymore
    ! (e.g. 2 -> 1 -> 0, go back, -> -1). so put $a0 onto $t0 and save $t0
    ! to the stack before jalr'ing, per the calling convention.
    add     $t0, $zero, $a0         ! store prev $a0
    addi    $sp, $sp, -1
    sw      $t0, 0($sp)
    addi    $a0, $a0, -1            ! decrement a0 by 1 (now it's clobbered)

    ! store prev return address
    addi    $sp, $sp, -1
    sw      $ra, 0($sp)

    lea     $at, fibonacci
    jalr    $at, $ra

    lw      $ra, 0($sp)
    addi    $sp, $sp, 1

                                    ! at this point, v0 has the ret value from f(n - 1)
    add     $s0, $zero, $v0         ! use $s0 to host ultimate ret value

    lw      $t0, 0($sp)
    addi    $sp, $sp, 1

    addi    $a0, $t0, -2            ! $a0 is useless at this point so reload value from stack and reset

    ! store prev return address
    addi    $sp, $sp, -1
    sw      $ra, 0($sp)

    lea     $at, fibonacci
    jalr    $at, $ra

    lw      $ra, 0($sp)             ! make sure to get previous return address, unlike in base cases
    addi    $sp, $sp, 1

                                    ! teardown will return prev $s0 value to $s0 for us
    add     $s0, $v0, $s0           ! add f(n - 2) to $s0
    add     $v0, $zero, $s0

    beq     $zero, $zero, teardown

base:
    add     $zero, $zero, $zero     ! TODO: Return $a0

    add     $v0, $zero, $a0

teardown:
    add     $zero, $zero, $zero     ! TODO: perform pre-return portion
                                    ! of the calling convention

    lw      $s0, 0($sp)
    addi    $sp, $sp, 1
    lw      $fp, 0($sp)
    addi    $sp, $sp, 1

    jalr    $ra, $zero              ! return to caller

stack: .word 0xFFFF                 ! the stack begins here


! Words for testing \/

! 1
testFibInput1:
    .word 0x0001

! 10
testFibInput2:
    .word 0x000a

! 20
testFibInput3:
    .word 0x0014
