今天来讲一下可能大家都会遇到过的面试题：**String,StringBuffer,StringBuilder的区别?**
# 1. String
我们先来大致看下String类的源码：
```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    /** The value is used for character storage. */
    private final char value[];

    /** Cache the hash code for the string */
    private int hash; // Default to 0

    ······    
    
    public char charAt(int index) {
        if ((index < 0) || (index >= value.length)) {
            throw new StringIndexOutOfBoundsException(index);
        }
        return value[index];
    }
    
    public int codePointAt(int index) {
        if ((index < 0) || (index >= value.length)) {
            throw new StringIndexOutOfBoundsException(index);
        }
        return Character.codePointAtImpl(value, index, value.length);
    }
    
    ······
}
```
String类被声明为final类，不能被继承。String类是不可变类，在它下面的拼接等操作，都会产生新的对象，如果对字符串操作频繁，用String操作显然效率不高。  

关于String是否线程安全的问题：**String是不可变类，不可变类本身就是线程安全的。**

## 字符串常量池
> 常量池(constant pool)指的是在编译期被确定，并被保存在已编译的.class文件中的一些数据。它包括了关于类、方法、接口等中的常量，也包括字符串常量。常量池中所有相同的字符串常量被合并，只占用一个空间。

知道了常量池的概念，下面我们来看一个示例：
```java
String str1 = "RedSpider";
String str2 = "RedSpider";
String str3 = "Red" + "Spider";
System.out.println(str1 == str2); // (1) true
System.out.println(str1 == str3); // (2) true
```

上面示例中的str1,str2在编译期就确定了，所以(1)返回true；当一个字符串由多个字符串常量连接而成时，也是字符串常量，也是在编译期确定，所以(2)也返回true。  
下面我们继续：
```java
String str4 = new String("RedSpider"); 
String str5 = "Red" + new String("Spider"); 
System.out.println(str1 == str4); // (4) false
System.out.println(str1 == str5); // (5) false
```

用new String()给str4赋值，不放入常量池，存储在堆中，所以(4)返回false；(5)同样也是因为用new的方式赋值，无法在编译期确定，所以(5)也返回false。  

## String intern()
先来看下intern()方法:
```java
 /**
 * Returns a canonical representation for the string object.
 * <p>
 * A pool of strings, initially empty, is maintained privately by the
 * class {@code String}.
 * <p>
 * When the intern method is invoked, if the pool already contains a
 * string equal to this {@code String} object as determined by
 * the {@link #equals(Object)} method, then the string from the pool is
 * returned. Otherwise, this {@code String} object is added to the
 * pool and a reference to this {@code String} object is returned.
 * <p>
 * It follows that for any two strings {@code s} and {@code t},
 * {@code s.intern() == t.intern()} is {@code true}
 * if and only if {@code s.equals(t)} is {@code true}.
 * <p>
 * All literal strings and string-valued constant expressions are
 * interned. String literals are defined in section 3.10.5 of the
 * <cite>The Java&trade; Language Specification</cite>.
 *
 * @return  a string that has the same contents as this string, but is
 *          guaranteed to be from a pool of unique strings.
 */
public native String intern();
```

在调用intern()方法的时候，回先去常量池里找，如果常量池内有相同的字符串，则会返回常量池内的实例， 否则会新增一个实例到常量池并返回这个实例。  
注意，上面的相同是用的String.equals()方法进行比较。  
讲完intern()方法，接下来我们再继续：
```java
String str6 = new String("RedSpider").intern();
String str7 = "Red" + new String("Spider").intern();
System.out.println(str1 == str6); // (6) true
System.out.println(str1 == str7); // (7) false
//  String str4 = new String("RedSpider");
System.out.println(str4 == str4.intern()); // (8) false
```

上面(6)中new String("RedSpider")调用intern()方法后，返回了常量池中"RedSpider"的引用，再赋值给str6, 所以(6)返回true；(7)第一眼看下去感觉应该返回true，其实不然， 因为str7的"Spider"部分虽然调用了intern()方法，但是在编译期并没有放入常量池，运行期才放进去。str7编译期没有在常量池里面，运行期没有对**拼合后的字符串**使用intern，所以str7还是在堆里面。所以(7)返回false；在(8)中，，str4调用intern()方法之后返回常量池的地址，但是并没有赋值给str4，str4仍然在堆中，所以(8)返回false。
# 2. StringBuffer
官方给出的定义是：一个线程安全的、可变的字符序列。此外，StringBuffer是线程安全的，保证线程安全的方式也非常简单粗暴，那就是StringBuffer里所有对字符操作的方法都加了synchronized关键字修饰。  
```java
@Override
public synchronized StringBuffer append(Object obj) {
    toStringCache = null;
    super.append(String.valueOf(obj));
    return this;
}

@Override
public synchronized StringBuffer delete(int start, int end) {
    toStringCache = null;
    super.delete(start, end);
    return this;
}
......
```

StringBuffer继承乐抽象类**AbstractStringBuilder**， 从下面的代码我们可以看出StringBuffer的**本质是一个字符数组**。value用来储存数组，count用来表示已使用的数组大小。StringBuffer中最主要的操作就是append()和insert()，而这些操作都是在value上进行的，而不会像String一样每次拼接等操作都会产生新的对象，所以**StringBuffer的效率要高于String**。
```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
    /**
     * The value is used for character storage.
     */
    char[] value;

    /**
     * The count is the number of characters used.
     */
    int count;
    ····
｝
```

**StringBuffer虽然保证了线程安全，但是线程安全的同时也带来了额外的性能开销，如果没有线程安全的需要，可以优先考虑StringBuilder。**

# 3. StringBuilder
可变的字符序列。StringBuilder提供了与StringBuffer兼容的API，但StringBuilder不保证线程安全。  
StringBuilder都有一个最低容量。只要StringBuilder中包含的字符序列的长度不超过最低容量，就不需要分配新的内部缓冲区。**如果内部缓冲区溢出，则自动扩容**。   
下面是StringBuilder的父类AbstractStringBuilder类中关于容量扩容的几个方法：
```java
···
private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;
···
/**
    * Ensures that the capacity is at least equal to the specified minimum.
    * If the current capacity is less than the argument, then a new internal
    * array is allocated with greater capacity. The new capacity is the
    * larger of:
    * <ul>
    * <li>The {@code minimumCapacity} argument.
    * <li>Twice the old capacity, plus {@code 2}.
    * </ul>
    * If the {@code minimumCapacity} argument is nonpositive, this
    * method takes no action and simply returns.
    * Note that subsequent operations on this object can reduce the
    * actual capacity below that requested here.
    *
    * @param   minimumCapacity   the minimum desired capacity.
    */
public void ensureCapacity(int minimumCapacity) {
    if (minimumCapacity > 0)
        ensureCapacityInternal(minimumCapacity);
}

/**
    * For positive values of {@code minimumCapacity}, this method
    * behaves like {@code ensureCapacity}, however it is never
    * synchronized.
    * If {@code minimumCapacity} is non positive due to numeric
    * overflow, this method throws {@code OutOfMemoryError}.
    */
private void ensureCapacityInternal(int minimumCapacity) {
    // overflow-conscious code
    if (minimumCapacity - value.length > 0) {
        value = Arrays.copyOf(value,
                newCapacity(minimumCapacity));
    }
}

······
/**
    * Returns a capacity at least as large as the given minimum capacity.
    * Returns the current capacity increased by the same amount + 2 if
    * that suffices.
    * Will not return a capacity greater than {@code MAX_ARRAY_SIZE}
    * unless the given minimum capacity is greater than that.
    *
    * @param  minCapacity the desired minimum capacity
    * @throws OutOfMemoryError if minCapacity is less than zero or
    *         greater than Integer.MAX_VALUE
    */
private int newCapacity(int minCapacity) {
    // overflow-conscious code
    int newCapacity = (value.length << 1) + 2;
    if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity;
    }
    return (newCapacity <= 0 || MAX_ARRAY_SIZE - newCapacity < 0)
        ? hugeCapacity(minCapacity)
        : newCapacity;
}
```

ensureCapacity()方法确保了容量至少等于指定的最小值。如果当前容量小于参数，那么就会分配一个更大容量的内部数组，**新容量大小为原来容量的两倍 + 2。**

# 4. 应用
- 在**字符串内容不经常发生变化**的业务场景优先使用**String**类。例如：常量声明、少量的字符串拼接操作等。如果有大量的字符串内容拼接，避免使用String与String之间的“+”操作，因为这样会产生大量无用的中间对象，耗费空间且执行效率低下（新建对象、回收对象花费大量时间）。
- 在**多线程环境下**频繁进行字符串的运算（如拼接、替换、删除等），建议使用**StringBuffer**，例如XML解析、HTTP参数解析与封装。
- 在**单线程环境下**频繁进行字符串的运算（如拼接、替换、删除等），建议使用**StringBuilder**，例如SQL语句拼装、JSON封装等。

# 5. 参考文章
- String，StringBuffer，StringBuilder源码  
- [Java提高篇——理解String 及 String.intern() 在实际中的应用](https://www.cnblogs.com/Qian123/p/5707154.html)  
- [Java：String、StringBuffer和StringBuilder的区别](https://blog.csdn.net/kingzone_2008/article/details/9220691)   
- [Java并发编程规则：不可变对象永远是线程安全的](https://blog.csdn.net/boonya/article/details/53585002)  
- [深入解析String#intern](https://tech.meituan.com/in_depth_understanding_string_intern.html) 
- [StringBuffer详解](https://blog.csdn.net/u012877472/article/details/50808554)  
- [StringBuilder详解](https://blog.csdn.net/u012877472/article/details/50812505)  
- [String源码分析:字符串拼接](https://www.jianshu.com/p/5dc687b4e4df)