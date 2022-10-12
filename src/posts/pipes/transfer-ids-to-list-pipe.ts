import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TransferIdsToListPipe implements PipeTransform {
  async transform(data) {
    const idsTo = data.idsToDelete
      ? typeof data.idsToDelete === 'object'
        ? data.idsToDelete
        : [data.idsToDelete]
      : [];
    data.idsToDelete = idsTo.map((e) => Number(e));
    return data;
  }
}
