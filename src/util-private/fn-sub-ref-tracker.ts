import * as cdk from '@aws-cdk/core';

/**
 * Utility class to build big Fn.sub statements.
 * @internal
 */
export class FnSubRefTracker {
  private readonly references: Record<string, string> = {};
  private counter: number = 0;

  /**
   * Create a reference to the given value and store the value for
   * later rendering.
   */
  ref(value: string): string {
    const name = `Ref${this.counter++}`;
    this.references[name] = value;
    return `\$\{${name}\}`;
  }

  /**
   * Render the template with Fn.sub, providing previous refs as variables
   * to be replaced once CloudFormation knows the resource arns.
   */
  render(template: string) {
    return cdk.Fn.sub(template, this.references);
  }
}